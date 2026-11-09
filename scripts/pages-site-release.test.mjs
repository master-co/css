import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { copyFile, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { test } from 'node:test'
import { ciMetadata, hostedMetadata, newestTag, planDelivery, registryFromNpm, registryFromState, selectExactTag, selectReleaseTag, verifyPublicRegistry } from './pages-site-release.mjs'
import { createManifest, inventoryDigest, jsonBytes, manifestName, manifestUrl, outputInventory, prepareIdentity, sha256 } from './pages-site-manifest.mjs'

const revision = 'a'.repeat(40)
const metadata = { repository: 'master-co/css', revision, releaseRevision: revision, version: '2.0.0', tag: 'v2.0.0', channel: 'main',
  deliveryBranch: 'codex/pages-stable', project: 'fixture', subdomain: 'fixture-suffix.pages.dev',
  origin: 'https://css.master.co', imageTransformations: false }
const registry = { url: 'https://registry.npmjs.org/', channel: 'latest', packages: [
  { name: '@master/css', version: metadata.version, integrity: 'sha512-YQ==', provenance: true }
] }
const ci = { GITHUB_REPOSITORY: metadata.repository, GITHUB_EVENT_NAME: 'push', GITHUB_SHA: revision,
  GITHUB_REF_NAME: 'main', PUBLIC_COMMIT_REF: 'main', PUBLIC_VERSION: '2.0.0', PUBLIC_URL: metadata.origin,
  MASTER_CSS_IMAGE_TRANSFORMATIONS: 'false', PAGES_PROJECT: metadata.project, PAGES_SUBDOMAIN: metadata.subdomain,
  PAGES_RELEASE_MODE: 'bootstrap', SITE_DELIVERY: 'release' }
const cf = { CF_PAGES: '1', CF_PAGES_BRANCH: metadata.deliveryBranch, CF_PAGES_COMMIT_SHA: revision,
  CF_PAGES_URL: `https://12345678.${metadata.subdomain}`, MASTER_CSS_PAGES_PROJECT: metadata.project,
  MASTER_CSS_PAGES_SUBDOMAIN: metadata.subdomain }
const refs = `${revision}\trefs/tags/v2.0.0\n${'b'.repeat(40)}\trefs/tags/v9.0.0\n`
const runGit = args => args[0] === 'ls-remote' ? refs : revision

test('tag resolution requires this exact commit, including annotated tag peeling', () => {
  assert.equal(selectExactTag(refs, revision, 'main'), 'v2.0.0')
  const annotated = `${'c'.repeat(40)}\trefs/tags/v2.0.0\n${revision}\trefs/tags/v2.0.0^{}\n`
  assert.equal(selectExactTag(annotated, revision, 'main'), 'v2.0.0')
  assert.throws(() => selectExactTag(refs, 'f'.repeat(40), 'main'), /exact source/)
  assert.throws(() => selectExactTag(refs, revision, 'rc'))
  assert.throws(() => selectExactTag(refs + `${revision}\trefs/tags/v2.0.1\n`, revision, 'main'))
})

test('CI binds actual release source/tag/version and an explicit delivery mode', () => {
  assert.deepEqual(ciMetadata(ci, runGit), metadata)
  assert.deepEqual(ciMetadata({ ...ci, PAGES_RELEASE_MODE: 'production' }, runGit), metadata)
  for (const wrong of [
    { GITHUB_REPOSITORY: 'fork/css' }, { GITHUB_EVENT_NAME: 'pull_request' }, { GITHUB_SHA: 'f'.repeat(40) },
    { PUBLIC_COMMIT_REF: 'rc' }, { PUBLIC_VERSION: '2.0.0-rc.1' }, { MASTER_CSS_IMAGE_TRANSFORMATIONS: 'true' },
    { PAGES_RELEASE_MODE: undefined }, { PAGES_RELEASE_MODE: 'maybe' }
  ]) assert.throws(() => ciMetadata({ ...ci, ...wrong }, runGit))
  assert.throws(() => ciMetadata(ci, args => args[0] === 'rev-parse' && args.includes('--verify') ? 'f'.repeat(40) : revision))
  assert.throws(() => ciMetadata({ ...ci, SITE_DELIVERY: undefined }, runGit), /Plan the delivery/)
})

test('CI binds a site-only commit to the unchanged packages of the release it documents', () => {
  const site = 'c'.repeat(40)
  const git = args => args.includes('--verify') ? revision : site
  assert.deepEqual(ciMetadata({ ...ci, GITHUB_SHA: site, SITE_DELIVERY: 'site' }, git), { ...metadata, revision: site })
  assert.throws(() => ciMetadata({ ...ci, SITE_DELIVERY: 'site' }, runGit), /tagged release commit/)
  assert.throws(() => ciMetadata({ ...ci, GITHUB_SHA: site, SITE_DELIVERY: 'release' }, git), /release tag differs/)
})

test('every push delivers the site, with its own release or the newest one, unless a release is pending', () => {
  const tags = ['v1.37.8', 'v2.0.0-rc.3', 'v2.0.2', 'v2.0.10', 'v2.0.9']
  assert.equal(newestTag(tags, 'main'), 'v2.0.10')
  assert.equal(newestTag(tags, 'rc'), 'v2.0.0-rc.3')
  assert.equal(newestTag(['v2.0.0-rc.1'], 'main'), undefined)
  assert.deepEqual(planDelivery({ released: true, version: '2.0.11', channel: 'main' }), { deliver: true, kind: 'release', version: '2.0.11' })
  assert.throws(() => planDelivery({ released: true, version: '', channel: 'main' }))
  // Commits that release nothing, even ones under package paths such as a README, deliver at once.
  const unchanged = planDelivery({ released: false, channel: 'main', reachableTags: tags, pendingRelease: tag => {
    assert.equal(tag, 'v2.0.10')
    return false
  } })
  assert.deepEqual(unchanged, { deliver: true, kind: 'site', version: '2.0.10' })
  const pending = planDelivery({ released: false, channel: 'main', reachableTags: tags, pendingRelease: () => 'patch' })
  assert.equal(pending.deliver, false)
  assert.match(pending.reason, /A patch release is pending since v2\.0\.10/)
  assert.equal(planDelivery({ released: false, channel: 'main', reachableTags: [], pendingRelease: () => false }).deliver, false)
})

test('Cloudflare resolves a site-only commit to the newest release of its channel', () => {
  const site = 'c'.repeat(40)
  assert.deepEqual(selectReleaseTag(refs, revision, 'main'), { tag: 'v2.0.0', releaseRevision: revision })
  assert.deepEqual(selectReleaseTag(refs, site, 'main'), { tag: 'v9.0.0', releaseRevision: 'b'.repeat(40) })
  const annotated = `${'d'.repeat(40)}\trefs/tags/v9.0.0\n${'b'.repeat(40)}\trefs/tags/v9.0.0^{}\n`
  assert.deepEqual(selectReleaseTag(annotated, site, 'main'), { tag: 'v9.0.0', releaseRevision: 'b'.repeat(40) })
  assert.throws(() => selectReleaseTag(refs, site, 'rc'), /published release/)
  assert.throws(() => selectReleaseTag(refs + `${revision}\trefs/tags/v2.0.1\n`, revision, 'main'))
})

test('Cloudflare maps the delivery ref to a logical channel and verifies its actual deployment host', () => {
  assert.deepEqual(hostedMetadata(cf, runGit), metadata)
  assert.deepEqual(hostedMetadata({ ...cf, PUBLIC_COMMIT_REF: 'main', PUBLIC_VERSION: '2.0.0',
    PUBLIC_URL: metadata.origin, MASTER_CSS_IMAGE_TRANSFORMATIONS: 'false' }, runGit), metadata)
  for (const wrong of [
    { CF_PAGES: undefined }, { CF_PAGES_BRANCH: 'main' }, { CF_PAGES_COMMIT_SHA: 'f'.repeat(40) },
    { PUBLIC_COMMIT_REF: 'rc' }, { PUBLIC_VERSION: '1.37.8' }, { PUBLIC_URL: 'https://preview.example' },
    { MASTER_CSS_IMAGE_TRANSFORMATIONS: 'true' }, { CF_PAGES_URL: 'https://css.master.co' },
    { CF_PAGES_URL: 'https://12345678.fixture.pages.dev' }, { CF_PAGES_URL: 'https://main.fixture-suffix.pages.dev' },
    { MASTER_CSS_PAGES_PROJECT: '' }, { MASTER_CSS_PAGES_SUBDOMAIN: '' }
  ]) assert.throws(() => hostedMetadata({ ...cf, ...wrong }, runGit))
  assert.throws(() => hostedMetadata(cf, args => args[0] === 'ls-remote' ? refs : 'f'.repeat(40)))
  assert.deepEqual(hostedMetadata(cf, args => args[0] === 'ls-remote' ? `${'b'.repeat(40)}\trefs/tags/v9.0.0` : revision),
    { ...metadata, releaseRevision: 'b'.repeat(40), version: '9.0.0', tag: 'v9.0.0' }, 'A site-only commit documents the newest release')
})

test('only a complete promoted registry cohort with the real registry consumer proof can authorize the manifest', () => {
  const state = { schemaVersion: 1, revision, version: metadata.version,
    channels: { latest: { complete: true, promoted: ['@master/css'] } },
    packages: [{ name: '@master/css', integrity: 'sha512-YQ==', provenance: true }],
    consumerProof: { revision, version: metadata.version, smoke: { native: 'native', nativeWasmParity: true,
      stackedConditions: true, publicPHPSource: true, cliHelp: true } } }
  assert.deepEqual(registryFromState(state, metadata, ['@master/css']), registry)
  for (const mutate of [
    s => { s.channels.latest.complete = false }, s => { s.channels.latest.promoted = [] },
    s => { s.revision = 'f'.repeat(40) }, s => { s.consumerProof.revision = 'f'.repeat(40) },
    s => { s.consumerProof.smoke.nativeWasmParity = false }, s => { s.packages[0].integrity = 'wrong' }
  ]) { const wrong = structuredClone(state); mutate(wrong); assert.throws(() => registryFromState(wrong, metadata, ['@master/css'])) }
  assert.throws(() => registryFromState(state, metadata, ['@master/css', '@master/css-cli']))
})

test('public registry verification reads exact versions and rejects absent, wrong or unattested bytes', async () => {
  const published = { name: '@master/css', version: '2.0.0', gitHead: revision, dist: { integrity: 'sha512-YQ==', attestations: { url: 'https://registry.npmjs.org/attestation' } } }
  const fetchApi = async (url, options) => {
    assert.equal(url, 'https://registry.npmjs.org/%40master%2Fcss/2.0.0')
    assert.equal(options.method, undefined)
    assert.equal(options.redirect, 'error')
    assert.ok(!options.headers.Authorization)
    return new Response(JSON.stringify(published))
  }
  await verifyPublicRegistry(registry, metadata, fetchApi)
  for (const status of [404, 403, 500]) await assert.rejects(verifyPublicRegistry(registry, metadata, async () => new Response('{}', { status })))
  for (const wrong of [
    { ...published, version: '1.0.0' }, { ...published, name: '@other/css' },
    { ...published, gitHead: undefined }, { ...published, gitHead: 'f'.repeat(40) },
    { ...published, dist: { ...published.dist, integrity: 'sha512-Yg==' } },
    { ...published, dist: { integrity: published.dist.integrity } }
  ]) await assert.rejects(verifyPublicRegistry(registry, metadata, async () => new Response(JSON.stringify(wrong))))
})

test('site-only registry evidence comes from npm: the documented version, its tagged source and the current dist-tag', async () => {
  const site = { ...metadata, revision: 'c'.repeat(40) }
  const published = { name: '@master/css', version: '2.0.0', gitHead: revision, dist: { integrity: 'sha512-YQ==', attestations: { url: 'https://registry.npmjs.org/attestation' } } }
  const npm = ({ tags = { latest: '2.0.0' }, version = published } = {}) => async (url, options) => {
    assert.equal(options.redirect, 'error')
    assert.ok(!options.headers.Authorization)
    if (url === 'https://registry.npmjs.org/-/package/%40master%2Fcss/dist-tags') return new Response(JSON.stringify(tags))
    assert.equal(url, 'https://registry.npmjs.org/%40master%2Fcss/2.0.0')
    return new Response(JSON.stringify(version))
  }
  assert.deepEqual(await registryFromNpm(site, ['@master/css'], npm()), registry)
  await assert.rejects(registryFromNpm(site, ['@master/css'], npm({ tags: { latest: '2.0.1' } })), /dist-tag moved/)
  await assert.rejects(registryFromNpm(site, ['@master/css'], npm({ version: { ...published, gitHead: site.revision } })), /source differs/)
  await assert.rejects(registryFromNpm(site, ['@master/css', '@master/css-cli'], npm()))
  await assert.rejects(registryFromNpm(site, ['@master/css'], async () => new Response('{}', { status: 404 })))
})

test('the real hosted shell command fails before installing tools when release identity is absent', async t => {
  const temporary = await mkdtemp(path.join(tmpdir(), 'master-pages-shell-'))
  t.after(() => rm(temporary, { recursive: true, force: true }))
  const script = fileURLToPath(new URL('./build-site-hosted.sh', import.meta.url))
  assert.throws(() => execFileSync('bash', [script], { env: { PATH: process.env.PATH, TMPDIR: temporary }, stdio: 'pipe' }), /Command failed/)
  assert.deepEqual(await readdir(temporary), [], 'The rejected build removes its temporary evidence directory')
})

test('the real hosted shell exports the exact release and rejects altered rebuilt bytes before success', async t => {
  const root = await mkdtemp(path.join(tmpdir(), 'master-pages-hosted-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  for (const name of ['scripts', 'tools', 'packages/css', 'site/.cache', 'verified/assets']) await mkdir(path.join(root, name), { recursive: true })
  for (const name of ['build-site-hosted.sh', 'pages-site-release.mjs', 'pages-site-manifest.mjs', 'pages-release-github.mjs']) {
    await copyFile(new URL(name, import.meta.url), path.join(root, 'scripts', name))
  }
  await writeFile(path.join(root, 'packages/css/package.json'), JSON.stringify({ name: '@master/css' }))
  const payload = { 'index.html': '<p>Release fixture</p>', 'assets/a.css': 'a{color:red}' }
  for (const [name, contents] of Object.entries(payload)) await writeFile(path.join(root, 'verified', name), contents)
  await prepareIdentity(path.join(root, 'verified'), metadata)
  const report = { revision, origin: metadata.origin, pages: 1, localLinks: 2, failures: [], sourceStatus: [],
    profiles: ['chromium', 'firefox', 'webkit'].map(engine => ({ engine })), buildDigest: inventoryDigest(await outputInventory(path.join(root, 'verified'))) }
  const manifest = await createManifest(path.join(root, 'verified'), metadata, jsonBytes(report), registry)
  await writeFile(path.join(root, 'manifest.json'), jsonBytes(manifest))
  await writeFile(path.join(root, 'payload.json'), JSON.stringify(payload))
  await writeFile(path.join(root, 'site/.cache/previous'), 'generated cache')
  await writeFile(path.join(root, 'fetch.mjs'), `
import { readFileSync } from 'node:fs'
globalThis.fetch = async (url, options) => {
  if (options.headers?.Authorization) throw new Error('Unexpected credential')
  const manifest = JSON.parse(readFileSync(process.env.PAGES_FIXTURE_MANIFEST))
  if (String(url).startsWith('https://github.com/master-co/css/releases/download/')) return new Response(JSON.stringify(manifest))
  if (String(url) === 'https://registry.npmjs.org/%40master%2Fcss/2.0.0') return new Response(JSON.stringify({
    name: '@master/css', version: manifest.version, gitHead: manifest.revision, dist: { integrity: 'sha512-YQ==', attestations: { url: 'https://registry.npmjs.org/fixture' } }
  }))
  throw new Error('Unmocked network request')
}
`)
  const executable = async (name, contents) => writeFile(path.join(root, 'tools', name), contents, { mode: 0o755 })
  await executable('git', `#!/usr/bin/env node
const args=process.argv.slice(2), sha=${JSON.stringify(revision)}
if(args[0]==='rev-parse') console.log(sha)
else if(args.includes('--tags')) console.log(sha+'\u0009refs/tags/v2.0.0')
else if(args.includes('--heads')) console.log(sha+'\u0009refs/heads/codex/pages-stable')
else throw new Error('Unexpected git request')
`)
  await executable('rustup', '#!/bin/sh\nexit 0\n')
  await executable('bun', `#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
fs.appendFileSync('trace.txt', process.argv.slice(2).join(' ')+'\\n')
if(process.argv[2]==='install') {
 if(fs.existsSync('site/.cache')) throw new Error('Old generated cache was not cleared')
} else if(process.argv[2]==='run' && process.argv[3]==='build:site') {
 if(process.env.PUBLIC_VERSION!=='2.0.0'||process.env.PUBLIC_COMMIT_REF!=='main'||process.env.PUBLIC_URL!=='https://css.master.co'||process.env.MASTER_CSS_IMAGE_TRANSFORMATIONS!=='false') throw new Error('Wrong build environment')
 fs.rmSync('site/out',{recursive:true,force:true})
 for(const [name,contents] of Object.entries(JSON.parse(fs.readFileSync('payload.json')))) {
  fs.mkdirSync(path.dirname('site/out/'+name),{recursive:true});fs.writeFileSync('site/out/'+name,contents)
 }
} else throw new Error('Unexpected bun command')
`)
  const env = { PATH: `${path.join(root, 'tools')}${path.delimiter}${process.env.PATH}`, HOME: root, TMPDIR: root,
    NODE_OPTIONS: `--import=${pathToFileURL(path.join(root, 'fetch.mjs')).href}`, ...cf,
    PAGES_FIXTURE_MANIFEST: path.join(root, 'manifest.json') }
  const result = execFileSync('bash', [path.join(root, 'scripts/build-site-hosted.sh')], { env, stdio: 'pipe', encoding: 'utf8' })
  assert.ok(result.includes(manifest.buildDigest))
  assert.deepEqual((await readFile(path.join(root, 'trace.txt'), 'utf8')).trim().split('\n'), ['install --frozen-lockfile', 'run build:site'])
  await writeFile(path.join(root, 'payload.json'), JSON.stringify({ ...payload, 'assets/a.css': 'a{color:blue}' }))
  assert.throws(() => execFileSync('bash', [path.join(root, 'scripts/build-site-hosted.sh')], { env, stdio: 'pipe' }), error => {
    assert.ok(error.stderr.toString().includes('Cloudflare output differs'))
    return true
  })
})

async function deliveryFixture(t, scenario) {
  const root = await mkdtemp(path.join(tmpdir(), 'master-pages-deliver-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  for (const name of ['scripts', 'tools', 'site/out', 'release-artifacts']) await mkdir(path.join(root, name), { recursive: true })
  for (const name of ['pages-site-release.mjs', 'pages-site-manifest.mjs', 'pages-release-github.mjs']) {
    await copyFile(new URL(name, import.meta.url), path.join(root, 'scripts', name))
  }
  await writeFile(path.join(root, 'site/out/index.html'), '<p>Exact release</p>')
  await prepareIdentity(path.join(root, 'site/out'), metadata)
  const identity = JSON.parse(await readFile(path.join(root, 'site/out/site-release.json'), 'utf8'))
  const report = { revision, origin: metadata.origin, pages: 1, localLinks: 2, failures: [], sourceStatus: [],
    profiles: ['chromium', 'firefox', 'webkit'].map(engine => ({ engine })),
    buildDigest: inventoryDigest(await outputInventory(path.join(root, 'site/out'))) }
  const manifest = await createManifest(path.join(root, 'site/out'), metadata, jsonBytes(report), registry)
  const data = jsonBytes(manifest)
  await writeFile(path.join(root, 'release-artifacts/site.manifest.json'), data)
  await writeFile(path.join(root, 'fixture.json'), JSON.stringify({ metadata, identity, assetName: manifestName(metadata),
    url: manifestUrl(metadata), digest: sha256(data) }))
  await writeFile(path.join(root, 'remote.json'), JSON.stringify({ asset: scenario !== 'asset-response-lost',
    pointer: scenario === 'create-pointer-response-lost' ? null : 'b'.repeat(40), mutations: [] }))
  await writeFile(path.join(root, 'tools/git'), `#!/usr/bin/env node\nconsole.log(${JSON.stringify(revision)})\n`, { mode: 0o755 })
  await writeFile(path.join(root, 'fetch.mjs'), `
import assert from 'node:assert/strict'
import fs from 'node:fs'
const {metadata:m,identity,assetName,url,digest}=JSON.parse(fs.readFileSync('fixture.json'))
const data=fs.readFileSync('release-artifacts/site.manifest.json')
const scenario=process.env.PAGES_FIXTURE_SCENARIO
const json=(value,status=200,headers={})=>new Response(JSON.stringify(value),{status,headers})
const remote=()=>JSON.parse(fs.readFileSync('remote.json'))
const mutate=(kind,change)=>{
  const attempt=JSON.parse(fs.readFileSync('release-artifacts/site-delivery.json')).attempts.at(-1)
  assert.equal(attempt.status,'running')
  assert.equal(attempt.writes.at(-1).outcome,'unknown','intent must exist before a mutation')
  assert.equal(attempt.writes.at(-1).operation,kind)
  const state=remote();Object.assign(state,change);state.mutations.push(kind)
  fs.writeFileSync('remote.json',JSON.stringify(state))
}
globalThis.fetch=async(address,options={})=>{
  address=String(address)
  if(address===url){assert.equal(options.headers?.Authorization,undefined);return new Response(data)}
  if(address.startsWith('https://registry.npmjs.org/'))return json({name:'@master/css',version:m.version,gitHead:m.revision,dist:{integrity:'sha512-YQ==',attestations:{url:'https://registry.npmjs.org/fixture'}}})
  if(address.startsWith('https://api.github.com/')||address.startsWith('https://uploads.github.com/'))assert.equal(options.headers.Authorization,'Bearer fixture-secret-token')
  else if(address.endsWith('/site-release.json')){
    assert.equal(options.headers?.Authorization,undefined)
    if(address.startsWith(m.origin)&&scenario==='canonical-failure')throw new Error('fixture-secret-token PRIVATE_ACCOUNT full-private-deployment-id')
    return json(identity,200,scenario==='immutable-failure'?{}:{'x-robots-tag':'noindex'})
  }else throw new Error('Blocked unmocked network request')
  if(address.includes('/releases/tags/'))return json({id:3,tag_name:m.tag,draft:false,prerelease:false,immutable:false})
  if(address.includes('/releases/3/assets?')&&!options.method)return json(remote().asset?[{name:assetName,size:data.length,digest:'sha256:'+digest,browser_download_url:url,created_at:new Date(Date.now()-10000).toISOString()}]:[])
  if(address.startsWith('https://uploads.github.com/')){
    assert.equal(options.method,'POST');mutate('create-manifest',{asset:true})
    throw new Error('fixture-secret-token PRIVATE_ACCOUNT full-private-deployment-id')
  }
  if(address.includes('/git/ref/heads/'))return remote().pointer?json({ref:'refs/heads/'+m.deliveryBranch,object:{type:'commit',sha:remote().pointer}}):json({},404)
  if(address.endsWith('/git/refs')&&options.method==='POST'){
    assert.deepEqual(JSON.parse(options.body),{ref:'refs/heads/'+m.deliveryBranch,sha:m.revision})
    mutate('create-pointer',{pointer:m.revision})
    throw new Error('fixture-secret-token PRIVATE_ACCOUNT full-private-deployment-id')
  }
  if(address.includes('/git/refs/heads/')&&options.method==='PATCH'){
    assert.deepEqual(JSON.parse(options.body),{sha:m.revision,force:false})
    mutate('advance-pointer',{pointer:m.revision})
    if(scenario==='pointer-response-lost')throw new Error('fixture-secret-token PRIVATE_ACCOUNT full-private-deployment-id')
    return json({})
  }
  if(address.includes('/check-runs?')){
    const id='12345678-1234-1234-1234-123456789abc'
    return json({check_runs:[{id:42,head_sha:m.revision,app:{slug:'cloudflare-workers-and-pages'},name:'Cloudflare Pages',started_at:new Date().toISOString(),status:'completed',conclusion:scenario==='cf-failure'?'failure':'success',external_id:id,details_url:'https://dash.cloudflare.com/PRIVATE_ACCOUNT/pages/view/'+m.project+'/'+id}]})
  }
  throw new Error('Blocked unmocked network request')
}
`)
  return { root, async run(nextScenario = scenario, mode = 'bootstrap') {
    const env = { PATH: `${path.join(root, 'tools')}${path.delimiter}${process.env.PATH}`, ...ci, GITHUB_TOKEN: 'fixture-secret-token',
      GITHUB_RUN_ID: '1234', GITHUB_RUN_ATTEMPT: '2', PAGES_RELEASE_MODE: mode, PAGES_FIXTURE_SCENARIO: nextScenario,
      NODE_OPTIONS: `--import=${pathToFileURL(path.join(root, 'fetch.mjs')).href}` }
    let output, code = 0
    try { output = execFileSync(process.execPath, ['scripts/pages-site-release.mjs', 'deliver'], { cwd: root, env, encoding: 'utf8', stdio: 'pipe', timeout: 10000 }) }
    catch (error) { code = error.status; output = error.stdout.toString() + error.stderr.toString() }
    const bytes = await readFile(path.join(root, 'release-artifacts/site-delivery.json'), 'utf8')
    for (const secret of ['fixture-secret-token', 'PRIVATE_ACCOUNT', '12345678-1234-1234-1234-123456789abc', 'full-private-deployment-id']) {
      assert.ok(!bytes.includes(secret)); assert.ok(!output.includes(secret))
    }
    return { code, receipt: JSON.parse(bytes), remote: JSON.parse(await readFile(path.join(root, 'remote.json'), 'utf8')) }
  } }
}

test('real delivery preserves source-bound failure receipts after acknowledged or uncertain writes', async t => {
  for (const scenario of ['cf-failure', 'asset-response-lost', 'pointer-response-lost', 'create-pointer-response-lost', 'immutable-failure', 'canonical-failure']) {
    await t.test(scenario, async child => {
      const fixture = await deliveryFixture(child, scenario)
      const result = await fixture.run(scenario, scenario === 'canonical-failure' ? 'production' : 'bootstrap')
      assert.equal(result.code, 1)
      const attempt = result.receipt.attempts[0]
      for (const [key, value] of Object.entries(metadata)) assert.deepEqual(attempt[key], value)
      assert.equal(attempt.status, 'failed'); assert.equal(attempt.canonicalVerified, false)
      assert.equal(attempt.immutablePagesVerified, scenario === 'canonical-failure')
      assert.equal(attempt.runId, '1234'); assert.equal(attempt.runAttempt, '2')
      assert.equal(attempt.mode, scenario === 'canonical-failure' ? 'production' : 'bootstrap')
      assert.equal(attempt.events[0].phase, 'intent')
      assert.equal(attempt.failure.code, 'PAGES_DELIVERY_NOT_VERIFIED')
      const uncertain = scenario.endsWith('response-lost')
      assert.equal(attempt.writes.at(-1).outcome, uncertain ? 'unknown' : 'acknowledged')
      if (scenario === 'asset-response-lost') {
        assert.equal(result.remote.asset, true); assert.equal(attempt.asset.verified, false)
        assert.equal(attempt.pointer, undefined)
      } else {
        assert.equal(result.remote.pointer, revision); assert.equal(attempt.asset.verified, true)
        assert.equal(attempt.pointer.verified, !scenario.endsWith('pointer-response-lost'))
      }
      if (scenario.endsWith('pointer-response-lost')) {
        const retry = await fixture.run('success')
        assert.equal(retry.code, 0); assert.equal(retry.receipt.attempts.length, 2)
        assert.deepEqual(retry.receipt.attempts[0], attempt, 'retry retains the exact previous uncertain attempt')
        assert.equal(retry.receipt.attempts[1].pointer.advanced, false)
        assert.equal(retry.receipt.attempts[1].immutablePagesVerified, true)
        assert.equal(retry.receipt.attempts[1].canonicalVerified, false)
        assert.deepEqual(retry.remote.mutations, [scenario.startsWith('create-') ? 'create-pointer' : 'advance-pointer'], 'retry verifies rather than repeating the write')
      }
    })
  }
})

test('real successful delivery records bootstrap and production checks separately', async t => {
  for (const mode of ['bootstrap', 'production']) {
    const fixture = await deliveryFixture(t, 'success')
    const { code, receipt } = await fixture.run('success', mode)
    assert.equal(code, 0)
    const attempt = receipt.attempts[0]
    assert.equal(attempt.status, 'success'); assert.equal(attempt.phase, 'complete')
    assert.equal(attempt.mode, mode); assert.equal(attempt.immutablePagesVerified, true)
    assert.equal(attempt.canonicalVerified, mode === 'production')
    assert.equal(attempt.pointer.verified, true); assert.equal(attempt.asset.verified, true)
    assert.equal(attempt.pages.checkRunId, 42)
    assert.equal(attempt.manifestSha256, attempt.asset.sha256)
  }
})
