import assert from 'node:assert/strict'
import { lstat, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execa } from 'execa'
import { cleanEnvironment } from './binding-closure-consumer.mjs'

export function registryConsumerEnvironment(environment, cache) {
  const allowed = /^(?:PATH|PATHEXT|HOME|USERPROFILE|SYSTEMROOT|WINDIR|COMSPEC|TMPDIR|TMP|TEMP|LANG|LC_ALL|LC_CTYPE|TZ|SSL_CERT_FILE|SSL_CERT_DIR|NODE_EXTRA_CA_CERTS)$/i
  return cleanEnvironment(Object.fromEntries(Object.entries(environment).filter(([key]) => allowed.test(key))), cache)
}

export const registryConsumerSource = String.raw`
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createEngine } from '@master/css'
import { createStylesheetCollection } from '@master/css-compiler/stylesheet'
import { MasterCSSScanner } from '@master/css-tooling/scanner/node'
import manifest from '@master/css-preset/default-manifest.json' with { type: 'json' }
assert.ok(Number(process.versions.node.split('.')[0]) >= 24)
const root = realpathSync(process.cwd())
const { loadNativeBinding, resolveNativeTarget } = await import(pathToFileURL(join(root, 'node_modules/@master/css-binding/dist/native-loader.js')).href)
const target = resolveNativeTarget()
const loaded = loadNativeBinding({ required: true })
assert.equal(loaded.info.surface, 'native')
assert.equal(realpathSync(loaded.source), realpathSync(join(root, 'node_modules', target.packageName, 'mastercss.node')))
const cssByBinding = {}
for (const binding of ['native', 'wasm']) {
  const engine = await createEngine({ manifest, binding })
  try {
    cssByBinding[binding] = engine.inspect('bg-black@dark@sm').rules.map(rule => rule.text).join('')
    assert.ok(cssByBinding[binding].startsWith('@media (prefers-color-scheme: dark){@media (width >= 52.125rem){'))
    assert.ok(cssByBinding[binding].includes('background-color:var(--color-black)'))
  } finally { engine.dispose() }
}
assert.equal(cssByBinding.native, cssByBinding.wasm)
mkdirSync('public'); mkdirSync('resources')
writeFileSync('public/index.php', '<h1 class="italic block">Hello World</h1>')
const source = '@import "@master/css"; @source "../public/index.php";'
writeFileSync('resources/app.css', source)
const scanner = new MasterCSSScanner({ manifest }, root)
const collection = createStylesheetCollection()
let phpCSS
try {
  await scanner.init()
  await collection.register(scanner, join(root, 'resources/app.css'), source, { baseManifest: manifest, projectDir: root })
  phpCSS = (await collection.compose({ scanner, baseManifest: manifest, projectDir: root })).css
  assert.ok(phpCSS.includes('.italic{font-style:italic}'))
  assert.ok(phpCSS.includes('.block{display:block}'))
} finally { collection.dispose(); await scanner.dispose() }
const cliIncluded = process.argv[2] !== 'without-cli'
if (cliIncluded) {
  const cliManifest = JSON.parse(readFileSync('node_modules/@master/css-cli/package.json', 'utf8'))
  const cli = join(root, 'node_modules/@master/css-cli', cliManifest.bin['master-css'])
  const help = execFileSync(process.execPath, [cli, '--help'], { encoding: 'utf8' })
  assert.match(help, /generate/)
}
console.log(JSON.stringify({ target: target.packageName, native: loaded.info.surface,
  nativeWasmParity: true, stackedConditions: true, publicPHPSource: true, cliHelp: cliIncluded }))
`

export function verifyRegistryLock(lock, state) {
  const expected = new Map(state.packages.map(pkg => [pkg.name, pkg]))
  const installed = []
  for (const [location, entry] of Object.entries(lock.packages ?? {})) {
    const name = location.split('node_modules/').at(-1)
    if (/^@master\//.test(name)) assert.ok(expected.has(name), `Unexpected workspace package in registry consumer: ${name}`)
    if (!expected.has(name)) continue
    assert.equal(entry.version, state.version, `Registry consumer version differs: ${name}`)
    assert.equal(entry.integrity, expected.get(name).integrity, `Registry consumer integrity differs: ${name}`)
    assert.ok(entry.resolved?.startsWith('https://registry.npmjs.org/'), `Consumer must install from public npm: ${name}`)
    installed.push(name)
  }
  for (const name of ['@master/css', '@master/css-compiler', '@master/css-binding', ...(expected.has('@master/css-cli') ? ['@master/css-cli'] : [])]) {
    assert.ok(installed.includes(name), `Registry consumer is missing ${name}`)
  }
  return [...new Set(installed)].sort()
}

/** Public reads only. No lifecycle scripts, workspace links, overrides or checkout fallback. */
export async function verifyRegistryConsumer(state, context, { run = execa } = {}) {
  assert.ok(Number(process.versions.node.split('.')[0]) >= 24, 'Registry consumer requires Node.js 24 or later')
  const temporary = await mkdtemp(join(tmpdir(), 'master-registry-consumer-'))
  const cwd = join(temporary, 'consumer'), cache = join(temporary, 'cache')
  try {
    await mkdir(cwd); await mkdir(cache)
    const env = registryConsumerEnvironment(context.env ?? process.env, cache)
    await writeFile(env.NPM_CONFIG_USERCONFIG, '')
    await writeFile(env.NPM_CONFIG_GLOBALCONFIG, '')
    await writeFile(join(cwd, 'package.json'), JSON.stringify({ private: true, type: 'module' }))
    const options = { cwd, env, extendEnv: false, preferLocal: false, timeout: 180_000 }
    const cliIncluded = state.packages.some(pkg => pkg.name === '@master/css-cli')
    const roots = ['@master/css', '@master/css-compiler', ...(cliIncluded ? ['@master/css-cli'] : [])]
    for (const name of roots) assert.ok(state.packages.some(pkg => pkg.name === name), `Consumer root absent from cohort: ${name}`)
    await run('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', '--registry', 'https://registry.npmjs.org/',
      ...roots.map(name => `${name}@${state.version}`)], options)
    const lock = JSON.parse(await readFile(join(cwd, 'package-lock.json')))
    const installed = verifyRegistryLock(lock, state)
    for (const [location, entry] of Object.entries(lock.packages)) {
      const name = location.split('node_modules/').at(-1)
      if (!installed.includes(name)) continue
      let stat
      try { stat = await lstat(join(cwd, location)) } catch (error) {
        if (error.code !== 'ENOENT' || !entry.optional || !/^@master\/css-binding-(darwin|linux|win32)-/.test(name)) throw error
        continue
      }
      assert.equal(stat.isSymbolicLink(), false, `Registry package must not be a workspace link: ${name}`)
      const actual = JSON.parse(await readFile(join(cwd, location, 'package.json')))
      assert.equal(actual.name, name)
      assert.equal(actual.version, state.version)
    }
    await writeFile(join(cwd, 'smoke.mjs'), registryConsumerSource)
    const result = await run(process.execPath, ['smoke.mjs', ...(cliIncluded ? [] : ['without-cli'])], options)
    const smoke = JSON.parse(result.stdout)
    assert.equal(smoke.native, 'native')
    for (const key of ['nativeWasmParity', 'stackedConditions', 'publicPHPSource']) assert.equal(smoke[key], true)
    assert.equal(smoke.cliHelp, cliIncluded)
    return { schemaVersion: 1, version: state.version, revision: state.revision, platform: process.platform, arch: process.arch,
      checkedAt: new Date().toISOString(), installed, smoke }
  } finally { await rm(temporary, { recursive: true, force: true }) }
}
