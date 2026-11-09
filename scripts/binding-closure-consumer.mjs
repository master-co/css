import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { createServer } from 'node:http'
import { cp, lstat, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { promisify } from 'node:util'

const exec = promisify(execFile)
const integrity = bytes => `sha512-${createHash('sha512').update(bytes).digest('base64')}`
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const readJSON = async file => JSON.parse(await readFile(file, 'utf8'))

export function cleanEnvironment(environment, cache) {
  const result = { ...environment }
  for (const key of Object.keys(result)) {
    if (/^(?:MASTER_CSS_NATIVE_BINDING_PATH|MASTER_CSS_NATIVE_CLI_PATH|NODE_PATH|NODE_OPTIONS|NPM_CONFIG_.*)$/i.test(key)) delete result[key]
  }
  return { ...result, NPM_CONFIG_CACHE: cache, NPM_CONFIG_USERCONFIG: join(cache, 'empty.npmrc'), NPM_CONFIG_GLOBALCONFIG: join(cache, 'empty-global.npmrc') }
}

export function verifyRevision(manifest, expectedRevision) {
  assert.match(manifest.revision, /^[a-f0-9]{40}$/, 'Closure revision must be a full commit SHA')
  if (expectedRevision) assert.equal(manifest.revision, expectedRevision, 'Closure and native runner must use the same revision')
}

/** Every installed workspace package must be one of the verified local archives. */
export async function installedLocations(consumer, lock, workspaceNames) {
  const locations = new Set([...Object.keys(lock.packages ?? {}),
    ...[...workspaceNames].map(name => `node_modules/${name}`)])
  const physical = new Set()
  for (const location of locations) {
    if (!workspaceNames.has(location.split('node_modules/').at(-1))) continue
    try {
      // lstat also catches dangling links, which must not count as absent packages.
      await lstat(join(consumer, location))
      physical.add(location)
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
    }
  }
  return physical
}

export function verifyInstalledLock(lock, expected, workspaceNames, physical, optionalTargets = new Set()) {
  assert.ok(physical instanceof Set, 'Inspect installed package paths before validating the lock')
  for (const location of physical) {
    const name = location.split('node_modules/').at(-1)
    if (workspaceNames.has(name)) assert.ok(expected.has(name), `Unexpected workspace package on disk: ${name}`)
  }
  const installed = new Set()
  for (const [location, entry] of Object.entries(lock.packages ?? {})) {
    const name = location.split('node_modules/').at(-1)
    if (!workspaceNames.has(name)) continue
    const candidate = expected.get(name)
    if (!candidate && optionalTargets.has(name) && !physical.has(location)) {
      // npm 11.12 retains failed optional resolutions as nested { optional: true }
      // placeholders. They contain no package metadata and have no filesystem entry.
      assert.deepEqual(entry, { optional: true }, `Unexpected optional target metadata: ${name}`)
      continue
    }
    assert.ok(candidate, `Unexpected workspace package installed: ${name}`)
    assert.ok(physical.has(location), `Candidate package is absent from disk: ${name}`)
    assert.equal(entry.version, candidate.version, `Wrong installed version: ${name}`)
    assert.ok(entry.resolved?.startsWith('file:'), `Workspace package came from a registry: ${name}`)
    assert.equal(entry.integrity, candidate.integrity, `Wrong installed archive integrity: ${name}`)
    installed.add(name)
  }
  for (const name of expected.keys()) assert.ok(installed.has(name), `Candidate package missing: ${name}`)
  return [...installed].sort()
}

async function runNPM(args, cwd, env) {
  return exec(npmCommand, args, { cwd, env, shell: process.platform === 'win32', maxBuffer: 16 * 1024 * 1024 })
}

// Run in a fresh process outside the checkout, importing only installed files.
const consumerSource = String.raw`
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync, realpathSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createEngine } from '@master/css'
import manifest from '@master/css-preset/default-manifest.json' with { type: 'json' }
const target = process.argv[2]
const expected = JSON.parse(readFileSync('expected.json', 'utf8'))
const root = realpathSync(process.cwd())
const bindingRoot = join(root, 'node_modules/@master/css-binding')
const { loadNativeBinding, resolveNativeTarget } = await import(pathToFileURL(join(bindingRoot, 'dist/native-loader.js')).href)
const detected = resolveNativeTarget()
assert.equal(detected.packageName, target)
const rustTargets = {
  '@master/css-binding-darwin-arm64': 'aarch64-apple-darwin',
  '@master/css-binding-darwin-x64': 'x86_64-apple-darwin',
  '@master/css-binding-linux-arm64-gnu': 'aarch64-unknown-linux-gnu',
  '@master/css-binding-linux-arm64-musl': 'aarch64-unknown-linux-musl',
  '@master/css-binding-linux-x64-gnu': 'x86_64-unknown-linux-gnu',
  '@master/css-binding-linux-x64-musl': 'x86_64-unknown-linux-musl',
  '@master/css-binding-win32-arm64-msvc': 'aarch64-pc-windows-msvc',
  '@master/css-binding-win32-x64-msvc': 'x86_64-pc-windows-msvc'
}
const loaded = loadNativeBinding({ required: true })
const targetRoot = realpathSync(join(root, 'node_modules', target))
assert.equal(realpathSync(loaded.source), join(targetRoot, 'mastercss.node'))
assert.equal(loaded.info.target, rustTargets[target])
assert.equal(loaded.info.surface, 'native')
const packageJSON = JSON.parse(readFileSync(join(targetRoot, 'package.json'), 'utf8'))
assert.equal(packageJSON.version, expected.version)
assert.equal(packageJSON.bin, undefined)
const executable = process.platform === 'win32' ? 'mcss.exe' : 'mcss'
assert.ok(packageJSON.files.includes(executable))
const cli = join(targetRoot, executable)
const selfTest = JSON.parse(execFileSync(cli, ['--self-test'], { encoding: 'utf8' }))
assert.equal(loaded.info.target, selfTest.binary.target)
assert.equal(loaded.info.packageVersion, selfTest.binary.packageVersion)
assert.equal(loaded.info.bindingAbiVersion, selfTest.binary.bindingAbiVersion)
assert.equal(selfTest.binary.surface, 'cli')
assert.equal(selfTest.css, '@layer utilities{.block{display:block}}')
const engine = await createEngine({ manifest, binding: 'native' })
try {
  assert.deepEqual(engine.inspect('bg-red-60').rules.map(rule => rule.text), ['.bg-red-60{background-color:var(--color-red-60)}'])
} finally { engine.dispose() }
console.log(JSON.stringify({ targetPackage: target, detected, nativeTarget: loaded.info.target, addon: loaded.source, cli,
  binding: loaded.info, selfTest, publicEngine: 'native bg-red-60 output passed',
  cliCoverage: 'Executable declared by the matching installed target package; unpublished CLI resolver is not invoked' }))
`

export async function consumeClosure({ closure, target, proof }) {
  assert.ok(Number(process.versions.node.split('.')[0]) >= 24, 'Candidate packages require Node.js 24 or later')
  const manifest = await readJSON(join(closure, 'closure.json'))
  assert.equal(manifest.schemaVersion, 1)
  verifyRevision(manifest, process.env.GITHUB_SHA)
  assert.equal(manifest.poisonArtifactsExcluded, true)
  const targetManifest = await readJSON(join(target, 'package.json'))
  assert.ok(manifest.targets.includes(targetManifest.name), 'Target is not in the prepared closure')
  const temporary = await mkdtemp(join(tmpdir(), 'mastercss-closure-'))
  const consumer = join(temporary, 'consumer')
  const cache = join(temporary, 'npm-cache')
  const env = cleanEnvironment(process.env, cache)
  const registryRequests = []
  const registry = createServer((request, response) => {
    registryRequests.push(decodeURIComponent(request.url))
    response.writeHead(404, { 'content-type': 'application/json' })
    response.end('{"error":"Workspace packages must come from candidate tarballs"}')
  })
  try {
    await Promise.all([mkdir(consumer), mkdir(cache)])
    await writeFile(env.NPM_CONFIG_USERCONFIG, '')
    await writeFile(env.NPM_CONFIG_GLOBALCONFIG, '')
    const source = join(temporary, 'target')
    await mkdir(source)
    for (const file of targetManifest.files) await cp(join(target, file), join(source, file), { recursive: true })
    await writeFile(join(source, 'package.json'), JSON.stringify({ ...targetManifest, version: manifest.version }))
    const { stdout } = await runNPM(['pack', source, '--json', '--ignore-scripts', '--pack-destination', temporary], source, env)
    const packedTarget = JSON.parse(stdout)[0]
    const targetArchive = join(temporary, packedTarget.filename)
    const targetBytes = await readFile(targetArchive)
    const packages = [...manifest.packages.map(entry => ({ ...entry, archive: resolve(closure, entry.file) })),
      { name: targetManifest.name, version: manifest.version, integrity: integrity(targetBytes), archive: targetArchive }]
    for (const entry of packages) {
      assert.equal(entry.version, manifest.version)
      assert.equal(integrity(await readFile(entry.archive)), entry.integrity, `Candidate archive changed: ${entry.name}`)
    }
    const dependencies = Object.fromEntries(packages.map(entry => [entry.name, `file:${entry.archive.replaceAll('\\', '/')}`]))
    await writeFile(join(consumer, 'package.json'), JSON.stringify({ private: true, type: 'module', dependencies, overrides: dependencies }))
    await new Promise(resolve => registry.listen(0, '127.0.0.1', resolve))
    await writeFile(join(consumer, '.npmrc'), `@master:registry=http://127.0.0.1:${registry.address().port}/\n`)
    await runNPM(['install', '--ignore-scripts', '--no-audit', '--no-fund'], consumer, env)
    const expected = new Map(packages.map(entry => [entry.name, entry]))
    const workspaceNames = new Set([...manifest.packages.map(entry => entry.name), ...manifest.targets])
    const lock = await readJSON(join(consumer, 'package-lock.json'))
    const unavailableTargets = new Set(manifest.targets.filter(name => name !== targetManifest.name))
    const physical = await installedLocations(consumer, lock, workspaceNames)
    const installed = verifyInstalledLock(lock, expected, workspaceNames, physical, unavailableTargets)
    for (const entry of packages) {
      const actual = await readJSON(join(consumer, 'node_modules', entry.name, 'package.json'))
      assert.equal(actual.name, entry.name)
      assert.equal(actual.version, manifest.version)
    }
    for (const request of registryRequests) assert.ok(unavailableTargets.has(request.replace(/^\//, '')), `Unexpected workspace registry request: ${request}`)
    await writeFile(join(consumer, 'expected.json'), JSON.stringify(manifest))
    await writeFile(join(consumer, 'smoke.mjs'), consumerSource)
    const result = await exec(process.execPath, ['smoke.mjs', targetManifest.name], { cwd: consumer, env, maxBuffer: 8 * 1024 * 1024 })
    const smoke = JSON.parse(result.stdout)
    const report = { schemaVersion: 1, revision: manifest.revision, version: manifest.version,
      platform: process.platform, arch: process.arch, node: process.version,
      poisonArtifactsExcluded: true, installed, packages: packages.map(({ archive, ...entry }) => entry),
      workspaceRegistry: 'Blocked by local reject-only registry', registryRequests, ...smoke }
    await mkdir(dirname(proof), { recursive: true })
    await writeFile(proof, JSON.stringify(report, null, 2) + '\n')
    return report
  } finally {
    registry.closeAllConnections()
    if (registry.listening) await new Promise(resolve => registry.close(resolve))
    await rm(temporary, { recursive: true, force: true })
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = process.argv.slice(2)
  const option = name => args.includes(name) ? args[args.indexOf(name) + 1] : undefined
  for (const name of ['--closure', '--target', '--proof']) assert.ok(option(name), `Pass ${name}`)
  console.log(JSON.stringify(await consumeClosure({ closure: resolve(option('--closure')), target: resolve(option('--target')), proof: resolve(option('--proof')) }), null, 2))
}
