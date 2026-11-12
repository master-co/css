import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, rename, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { checkVerifiedOutput, createManifest, identityPath, inventoryDigest, jsonBytes, manifestName, outputInventory, prepareIdentity, releaseMetadata, validateManifest, verifyOutput } from './pages-site-manifest.mjs'

const metadata = { repository: 'master-co/css', revision: 'a'.repeat(40), releaseRevision: 'a'.repeat(40), version: '2.0.0', tag: 'v2.0.0',
  channel: 'main', deliveryBranch: 'pages-stable', project: 'fixture', subdomain: 'fixture-suffix.pages.dev',
  origin: 'https://css.master.co', imageTransformations: false, legacyDesignCutover: false }
const registry = { url: 'https://registry.npmjs.org/', channel: 'latest', packages: [
  { name: '@master/css', version: metadata.version, integrity: 'sha512-YQ==', provenance: true }
] }

async function fixture(t) {
  const out = await mkdtemp(path.join(tmpdir(), 'master-pages-manifest-'))
  t.after(() => rm(out, { recursive: true, force: true }))
  await mkdir(path.join(out, 'assets'))
  await writeFile(path.join(out, 'index.html'), '<!doctype html><p>Release fixture</p>')
  await writeFile(path.join(out, 'assets/a.css'), 'a{color:red}')
  await writeFile(path.join(out, '_headers'), '/*\n  X-Content-Type-Options: nosniff\n')
  await prepareIdentity(out, metadata)
  const report = { revision: metadata.revision, origin: metadata.origin, buildDigest: inventoryDigest(await outputInventory(out)),
    failures: [], pages: 1, localLinks: 2, profiles: ['chromium', 'firefox', 'webkit'].map(engine => ({ engine })), sourceStatus: ['?? site/.cache/'] }
  const manifest = await createManifest(out, metadata, jsonBytes(report), registry)
  return { out, report, manifest }
}

test('the external manifest covers every final file, including a non-recursive public identity', async t => {
  const { out, manifest } = await fixture(t)
  assert.equal(manifest.files.length, 4)
  assert.ok(manifest.files.some(file => file.path === identityPath))
  const identity = JSON.parse(await readFile(path.join(out, identityPath)))
  assert.equal(identity.payloadDigest, inventoryDigest(manifest.files.filter(file => file.path !== identityPath)))
  assert.equal(identity.revision, metadata.revision)
  assert.ok(!('manifestSha256' in identity) && !('accountId' in identity) && !('mode' in identity))
  assert.deepEqual(await verifyOutput(out, manifest, metadata), { revision: metadata.revision, version: metadata.version, files: 4, buildDigest: manifest.buildDigest })
})

test('same source and bytes reproduce independently of checkout/output paths', async t => {
  const first = await fixture(t), second = await fixture(t)
  assert.notEqual(first.out, second.out)
  assert.deepEqual(first.manifest, second.manifest)
  await prepareIdentity(first.out, metadata)
  await verifyOutput(first.out, first.manifest, metadata)
})

for (const mutation of ['content', 'missing', 'renamed', 'extra-hidden', 'identity', 'symlink']) {
  test(`an ${mutation} output change cannot reuse the tested manifest`, async t => {
    const { out, manifest } = await fixture(t)
    const css = path.join(out, 'assets/a.css')
    if (mutation === 'content') await writeFile(css, 'a{color:blue}')
    if (mutation === 'missing') await rm(css)
    if (mutation === 'renamed') await rename(css, path.join(out, 'assets/b.css'))
    if (mutation === 'extra-hidden') await writeFile(path.join(out, '.unexpected'), 'unexpected')
    if (mutation === 'identity') await writeFile(path.join(out, identityPath), '{}')
    if (mutation === 'symlink') await symlink('index.html', path.join(out, 'linked.html'))
    await assert.rejects(verifyOutput(out, manifest, metadata))
  })
}

test('browser proof must identify these exact final bytes and all three engines', async t => {
  const { out, report } = await fixture(t)
  for (const wrong of [
    { ...report, revision: 'b'.repeat(40) }, { ...report, buildDigest: 'b'.repeat(64) },
    { ...report, origin: 'https://preview.example' }, { ...report, failures: [{ name: 'browser failure' }] },
    { ...report, profiles: [{ engine: 'chromium' }] }, { ...report, sourceStatus: [' M site/content/page.astro'] },
    { ...report, sourceStatus: ['?? site/unreviewed.mdx'] }
  ]) await assert.rejects(createManifest(out, metadata, jsonBytes(wrong), registry))
})

test('a validation build is reusable only with the identity and proof of this exact delivery', async t => {
  const { out, report } = await fixture(t)
  assert.equal((await checkVerifiedOutput(out, metadata, jsonBytes(report))).metadata.version, metadata.version)
  // Another release, project or origin writes another identity, so the same bytes cannot be reused.
  for (const other of [{ ...metadata, version: '2.0.1', tag: 'v2.0.1' }, { ...metadata, project: 'other' }]) {
    await assert.rejects(checkVerifiedOutput(out, other, jsonBytes(report)), /identity/)
  }
  await assert.rejects(checkVerifiedOutput(out, metadata, jsonBytes({ ...report, sourceStatus: [' M site/content/page.astro'] })))
  await writeFile(path.join(out, 'assets/a.css'), 'a{color:blue}')
  await assert.rejects(checkVerifiedOutput(out, metadata, jsonBytes(report)), /final output/)
})

test('manifest identity, registry integrity and exact path inventory fail closed', async t => {
  const { manifest } = await fixture(t)
  for (const mutate of [
    m => { m.revision = 'b'.repeat(40) }, m => { m.project = 'another-project' },
    m => { m.deliveryBranch = 'main' }, m => { m.imageTransformations = true },
    m => { m.files[0].path = '../escape' }, m => { m.files[0].path = '/absolute' },
    m => { m.files[0].path = 'assets\\escape' }, m => { m.files.push(m.files[0]) },
    m => { m.files.pop() }, m => { m.registry.packages[0].version = '1.0.0' },
    m => { m.registry.packages[0].integrity = 'bad-integrity' }, m => { m.registry.channel = 'rc' }
  ]) {
    const wrong = structuredClone(manifest); mutate(wrong)
    assert.throws(() => validateManifest(wrong, metadata))
  }
})

test('logical channel, actual version and delivery ref are deliberately distinct', () => {
  assert.equal(releaseMetadata(metadata).deliveryBranch, 'pages-stable')
  assert.equal(manifestName(metadata), `site-main-${metadata.revision}.manifest.json`)
  // Only main delivers the site; prerelease channels publish npm packages without a site.
  assert.throws(() => releaseMetadata({ ...metadata, version: '2.0.0-rc.1', tag: 'v2.0.0-rc.1', channel: 'rc',
    origin: 'https://rc.css.master.co', deliveryBranch: 'codex/pages-rc' }), /Only main/)
  assert.throws(() => releaseMetadata({ ...metadata, version: '2.0.0-rc.1', tag: 'v2.0.0-rc.1' }), /stable release/)
  assert.throws(() => releaseMetadata({ ...metadata, deliveryBranch: 'codex/pages-stable' }))
  assert.throws(() => releaseMetadata({ ...metadata, origin: 'https://rc.css.master.co' }))
  assert.throws(() => releaseMetadata({ ...metadata, subdomain: 'https://fixture.pages.dev/' }))
})


test('cutover identity rejects absent, partial and stale worker artifacts', async t => {
  const { out, report } = await fixture(t)
  const enabled = { ...metadata, legacyDesignCutover: true }
  await assert.rejects(prepareIdentity(out, enabled), /_worker.js presence/)
  await assert.rejects(checkVerifiedOutput(out, enabled, jsonBytes(report)), /presence/)
  await writeFile(path.join(out, '_worker.js'), 'export default {}')
  await assert.rejects(prepareIdentity(out, enabled), /_routes.json presence/)
  await assert.rejects(prepareIdentity(out, metadata), /_worker.js presence/)
  await writeFile(path.join(out, '_routes.json'), '{"version":1}')
  await prepareIdentity(out, enabled)
  const proof = { ...report, buildDigest: inventoryDigest(await outputInventory(out)) }
  const manifest = await createManifest(out, enabled, jsonBytes(proof), registry)
  await verifyOutput(out, manifest, enabled)
  assert.throws(() => validateManifest(manifest, metadata), /identity differs/)
})
