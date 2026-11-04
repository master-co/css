import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { getCurrentTarget, getRuntimePackagesForTarget } from './package-target-core.js'
import { verifyLanguageServer } from './verify-vsix-lsp.mjs'
import { verifyExtensionHost } from './verify-vsix-host.mjs'

export function verificationEnvironment(original) {
  // Explicit undefined also removes inherited values in test-electron's env merge.
  return Object.fromEntries(Object.entries(original).map(([key, value]) => [key,
    /^(?:NODE_PATH|NODE_OPTIONS|ELECTRON_RUN_AS_NODE|MASTER_CSS_NATIVE_(?:BINDING|CLI)_PATH|VSCE_PAT|OVSX_PAT)$/i.test(key) ? undefined : value]))
}

export async function verifyVSIX({ vsix, target, publisher, proof, testElectronModule, executable, vscodeVersion = '1.144.0' }) {
  assert.equal(target, getCurrentTarget(), 'Native verification must run on its actual target')
  assert.ok(['masterco', 'master'].includes(publisher))
  // Keep macOS's extension-host IPC socket below its Unix-domain path limit.
  const temporary = await mkdtemp(join(tmpdir(), 'mcv-'))
  const env = verificationEnvironment(process.env)
  try {
    if (process.platform === 'win32') execFileSync('tar', ['-xf', vsix, '-C', temporary], { env })
    else execFileSync('unzip', ['-q', vsix, '-d', temporary], { env })
    const root = join(temporary, 'extension')
    const manifest = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
    assert.equal(manifest.name, 'master-css-vscode')
    assert.equal(manifest.publisher, publisher)
    const xml = await readFile(join(temporary, 'extension.vsixmanifest'), 'utf8')
    assert.ok(xml.includes(`TargetPlatform="${target}"`), 'VSIX target metadata must match the tested host')
    assert.ok(xml.includes(`Version="${manifest.version}"`))
    const expectedPackage = getRuntimePackagesForTarget(target)[0]
    const scope = join(root, 'dist/node_modules/@master')
    assert.deepEqual((await readdir(scope)).filter(name => name.startsWith('css-binding-')), [expectedPackage.split('/')[1]])
    const nativeRoot = join(scope, expectedPackage.split('/')[1])
    // A separate process releases Windows's DLL lock before temporary files are removed.
    const binding = JSON.parse(execFileSync(process.execPath, ['-e',
      'process.stdout.write(require(process.argv[1]).bindingInfoJson())', join(nativeRoot, 'mastercss.node')],
    { cwd: root, env, encoding: 'utf8', timeout: 30_000 }))
    assert.equal(binding.surface, 'native')
    const architecture = target.endsWith('arm64') ? 'aarch64' : 'x86_64'
    const abi = target.startsWith('darwin-') ? 'apple-darwin' : target.startsWith('win32-') ? 'pc-windows-msvc'
      : target.startsWith('alpine-') ? 'unknown-linux-musl' : 'unknown-linux-gnu'
    assert.equal(binding.target, `${architecture}-${abi}`)
    const cli = join(nativeRoot, target.startsWith('win32-') ? 'mcss.exe' : 'mcss')
    const selfTest = JSON.parse(execFileSync(cli, ['--self-test'], { cwd: root, env, encoding: 'utf8', timeout: 30_000 }))
    assert.equal(selfTest.binary.target, binding.target)
    assert.equal(selfTest.binary.bindingAbiVersion, binding.bindingAbiVersion)
    assert.equal(selfTest.binary.packageVersion, binding.packageVersion)
    assert.equal(selfTest.css, '@layer utilities{.block{display:block}}')
    const lsp = await verifyLanguageServer(join(root, 'dist/server.min.js'), temporary, env)
    const extensionHost = testElectronModule ? await verifyExtensionHost({ vsix, manifest, temporary, env,
      testElectronModule, executable, vscodeVersion }) : null
    const report = { schemaVersion: 1, revision: process.env.GITHUB_SHA ?? execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
      target, publisher, version: manifest.version, node: process.version, binding, lsp, extensionHost,
      vsix: { file: vsix, sha256: createHash('sha256').update(await readFile(vsix)).digest('hex') },
      activationCoverage: extensionHost ? 'Official VS Code desktop installed extension' : 'Bundled native language server only; remote extension host activation not verified' }
    await mkdir(dirname(proof), { recursive: true })
    await writeFile(proof, JSON.stringify(report, null, 2) + '\n')
    return report
  } finally {
    await rm(temporary, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 })
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = process.argv.slice(2)
  const option = key => args.includes(key) ? args[args.indexOf(key) + 1] : undefined
  for (const key of ['--vsix', '--target', '--publisher', '--proof']) assert.ok(option(key), `${key} is required`)
  console.log(JSON.stringify(await verifyVSIX({ vsix: resolve(option('--vsix')), target: option('--target'), publisher: option('--publisher'),
    proof: resolve(option('--proof')), testElectronModule: option('--test-electron-module'), executable: option('--executable'),
    vscodeVersion: option('--vscode-version') }), null, 2))
}
