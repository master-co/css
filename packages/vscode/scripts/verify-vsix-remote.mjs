import assert from 'node:assert/strict'
import { spawn, execFileSync } from 'node:child_process'
import { once } from 'node:events'
import { createHash, randomBytes } from 'node:crypto'
import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { extractVSIX } from './extract-vsix.mjs'
import { verificationEnvironment } from './verify-vsix.mjs'

export const SERVER_VERSION = '1.123.0'
export const SERVER_COMMIT = '6a44c352bd24569c417e530095901b649960f9f8'
export const SERVER_ARCHIVES = {
  'alpine-x64': { platform: 'server-linux-alpine-web', sha256: 'e66e282e1f3b95507b47d46b313cc0436e2b5586c27a6d0b3f0ad98a1d2a8ce7' },
  'alpine-arm64': { platform: 'server-alpine-arm64-web', sha256: 'b95c0c95e5f51ad043c10c4f80611dfd14d95e066cb1ce2eb5bd9c610cf02d20' },
  // Local protocol/driver verification without Docker; never accepted as an Alpine proof.
  'darwin-arm64': { platform: 'server-darwin-arm64-web', sha256: 'f4c115ebfff0cdc5a44a4bb17056a755b3ab535a2c58d5aa847493a081a1c9a8' }
}
const hash = bytes => createHash('sha256').update(bytes).digest('hex')

export function validateServerMetadata(metadata, target) {
  const expected = SERVER_ARCHIVES[target]
  assert.ok(expected, `No reviewed official server for ${target}`)
  assert.equal(metadata.version, SERVER_COMMIT, 'Official server commit differs')
  assert.equal(metadata.productVersion, SERVER_VERSION, 'Official server version differs')
  assert.equal(metadata.sha256hash, expected.sha256, 'Official server checksum differs')
  const url = new URL(metadata.url)
  assert.equal(url.origin, 'https://vscode.download.prss.microsoft.com')
  const filename = `vscode-${expected.platform}.${target.startsWith('darwin-') ? 'zip' : 'tar.gz'}`
  assert.equal(url.pathname, `/dbazure/download/stable/${SERVER_COMMIT}/${filename}`, 'Official server archive target differs')
  return expected
}

export function remoteTestURL(endpoint, remoteRoot) {
  const url = new URL(endpoint)
  assert.equal(url.protocol, 'http:')
  assert.ok(['127.0.0.1', 'localhost'].includes(url.hostname), 'Remote verification must stay on loopback')
  url.searchParams.set('folder', `${remoteRoot}/workspace`)
  url.searchParams.set('payload', JSON.stringify([
    ['extensionDevelopmentPath', `vscode-remote://${url.host}${remoteRoot}/driver`],
    ['extensionTestsPath', `vscode-remote://${url.host}${remoteRoot}/driver/test.cjs`],
    ['skipWelcome', 'true']
  ]))
  return url.href
}

async function officialServer(temporary, target, archivePath) {
  const expected = SERVER_ARCHIVES[target]
  assert.ok(expected)
  const metadataResponse = await fetch(`https://update.code.visualstudio.com/api/versions/${SERVER_VERSION}/${expected.platform}/stable`, { signal: AbortSignal.timeout(30_000) })
  assert.equal(metadataResponse.status, 200)
  const metadata = await metadataResponse.json()
  validateServerMetadata(metadata, target)
  let bytes
  if (archivePath) bytes = await readFile(archivePath)
  else {
    const response = await fetch(metadata.url, { redirect: 'error', signal: AbortSignal.timeout(180_000) })
    assert.equal(response.status, 200)
    bytes = Buffer.from(await response.arrayBuffer())
  }
  assert.equal(hash(bytes), expected.sha256, 'Official server download checksum differs')
  const archive = join(temporary, target.startsWith('darwin-') ? 'server.zip' : 'server.tar.gz')
  await writeFile(archive, bytes)
  const extracted = join(temporary, 'server-extracted')
  await mkdir(extracted)
  if (target.startsWith('darwin-')) extractVSIX(archive, extracted)
  else execFileSync('tar', ['-xzf', archive, '-C', extracted])
  const entries = await readdir(extracted)
  assert.equal(entries.length, 1, 'Expected one official server archive root')
  const server = join(extracted, entries[0])
  const product = JSON.parse(await readFile(join(server, 'product.json'), 'utf8'))
  assert.equal(product.commit, SERVER_COMMIT, 'Extracted server commit differs')
  assert.equal(JSON.parse(await readFile(join(server, 'package.json'), 'utf8')).version, SERVER_VERSION)
  await cp(server, join(temporary, 'server'), { recursive: true })
  return { version: SERVER_VERSION, commit: SERVER_COMMIT, platform: expected.platform, sha256: expected.sha256 }
}

export async function verifyRemoteVSIX({ vsix, target, publisher, proof, playwrightModule, archivePath, local = false }) {
  assert.ok(local ? target === 'darwin-arm64' && process.platform === 'darwin' && process.arch === 'arm64' : target.startsWith('alpine-') && process.platform === 'linux')
  assert.equal(process.arch, target.endsWith('arm64') ? 'arm64' : 'x64', 'Remote container must run on its matching architecture')
  const report = JSON.parse(await readFile(proof, 'utf8'))
  assert.equal(report.target, target)
  assert.equal(report.publisher, publisher)
  assert.equal(report.vsix.sha256, hash(await readFile(vsix)), 'Remote host must install the native-tested VSIX bytes')
  if (process.env.GITHUB_SHA) assert.equal(report.revision, process.env.GITHUB_SHA)
  const temporary = await mkdtemp(join(tmpdir(), 'mcv-remote-'))
  const remoteRoot = local ? temporary : '/verification'
  const containerName = `master-css-editor-${randomBytes(8).toString('hex')}`
  const token = randomBytes(24).toString('hex')
  const env = verificationEnvironment(process.env)
  let child, browser, log = '', timer
  try {
    const server = await officialServer(temporary, target, archivePath)
    await cp(vsix, join(temporary, 'candidate.vsix'))
    await Promise.all(['driver', 'workspace', 'extensions', 'user-home', 'user-data/User'].map(path => mkdir(join(temporary, path), { recursive: true })))
    await writeFile(join(temporary, 'token'), token, { mode: 0o600 })
    await writeFile(join(temporary, 'user-data/User/settings.json'), JSON.stringify({ 'telemetry.telemetryLevel': 'off', 'extensions.autoUpdate': false, 'extensions.autoCheckUpdates': false, 'security.workspace.trust.enabled': false, 'chat.disableAIFeatures': true }))
    await writeFile(join(temporary, 'driver/package.json'), JSON.stringify({ name: 'vsix-remote-verification-driver', version: '0.0.0', publisher: 'verification', engines: { vscode: `^${SERVER_VERSION}` }, extensionKind: ['workspace'], main: 'index.cjs' }))
    await writeFile(join(temporary, 'driver/index.cjs'), 'exports.activate = () => {}\n')
    await cp(new URL('../tests/vsix-extension-host.cjs', import.meta.url), join(temporary, 'driver/test.cjs'))
    await writeFile(join(temporary, 'driver/expected.json'), JSON.stringify({ id: `${publisher}.master-css-vscode`, version: report.version,
      extensionsDir: `${remoteRoot}/extensions`, remote: { platform: local ? 'darwin' : 'linux', arch: process.arch, musl: !local } }))
    const executable = `${remoteRoot}/server/bin/code-server`
    const common = ['--accept-server-license-terms', '--extensions-dir', `${remoteRoot}/extensions`, '--user-data-dir', `${remoteRoot}/user-data`, '--server-data-dir', `${remoteRoot}/server-data`]
    const serve = [...common, '--host=127.0.0.1', '--port=0', '--connection-token-file', `${remoteRoot}/token`, '--disable-telemetry', '--disable-workspace-trust']
    if (local) {
      execFileSync(executable, [...common, '--install-extension', `${remoteRoot}/candidate.vsix`, '--force'], { env, timeout: 120_000 })
      child = spawn(join(temporary, 'server/node'), [join(temporary, 'server/out/server-main.js'), ...serve], { env, detached: true, stdio: ['ignore', 'pipe', 'pipe'] })
    } else {
      // A disposable test fixture only: no published port, public tunnel, or account.
      assert.ok(process.getuid() > 0 && process.getgid() > 0, 'Run the CI fixture as the unprivileged runner user')
      const launch = '"$@" --install-extension /verification/candidate.vsix --force\nexec "$@" --host=127.0.0.1 --port=0 --connection-token-file /verification/token --disable-telemetry --disable-workspace-trust'
      const script = 'apk add --no-cache libstdc++ bash su-exec\naddgroup -g "$HOST_GID" verification\nadduser -D -H -u "$HOST_UID" -G verification verification\nexec su-exec verification sh -ec "$LAUNCH" sh "$@"'
      child = spawn('docker', ['run', '--rm', '--name', containerName, '--network', 'host', '-e', 'HOST_UID', '-e', 'HOST_GID', '-e', 'LAUNCH', '-e', 'HOME=/verification/user-home', '-v', `${temporary}:/verification`, 'alpine:3.24', 'sh', '-ec', script, 'sh', executable, ...common],
        { env: { ...env, HOST_UID: String(process.getuid()), HOST_GID: String(process.getgid()), LAUNCH: launch }, stdio: ['ignore', 'pipe', 'pipe'] })
    }
    const endpoint = await new Promise((resolveEndpoint, reject) => {
      timer = setTimeout(() => reject(new Error(`Official remote server startup timed out: ${log}`)), 120_000)
      let lines = ''
      const output = chunk => {
        const text = chunk.toString()
        log += text.replaceAll(token, '<redacted>')
        lines += text
        const end = lines.lastIndexOf('\n')
        if (end < 0) return
        const complete = lines.slice(0, end)
        lines = lines.slice(end + 1)
        const match = /Web UI available at (http:\/\/[^\s]+)/.exec(complete)
        if (match) { clearTimeout(timer); resolveEndpoint(match[1]) }
      }
      child.stdout.on('data', output); child.stderr.on('data', output)
      child.once('error', reject)
      child.once('exit', code => reject(new Error(`Official remote server exited ${code}: ${log}`)))
    })
    const { chromium } = await import(pathToFileURL(playwrightModule).href)
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()
    let finish
    const completed = new Promise((resolveExit, reject) => {
      timer = setTimeout(() => reject(new Error(`Remote extension tests timed out: ${log}`)), 120_000)
      finish = code => { clearTimeout(timer); code === 0 ? resolveExit() : reject(new Error(`Remote extension tests exited ${code}: ${log}`)) }
    })
    await page.exposeFunction('codeAutomationLog', (_type, args) => { log += JSON.stringify(args).replaceAll(token, '<redacted>') })
    await page.exposeFunction('codeAutomationExit', finish)
    await Promise.all([page.goto(remoteTestURL(endpoint, remoteRoot)), completed])
    const host = JSON.parse(await readFile(join(temporary, 'driver/host-proof.json'), 'utf8'))
    assert.equal(host.kind, 'remote')
    assert.equal(host.remote.platform, local ? 'darwin' : 'linux')
    assert.equal(host.remote.arch, process.arch)
    assert.equal(host.remote.musl, !local)
    report.extensionHost = { ...host, server }
    report.activationCoverage = 'Official VS Code Server remote Node extension host, loopback browser client'
    await writeFile(proof, JSON.stringify(report, null, 2) + '\n')
    return report
  } catch (error) {
    for (const root of ['server-data', 'user-data']) {
      const directory = join(temporary, root)
      for (const file of await readdir(directory, { recursive: true }).catch(() => [])) {
        if (!file.endsWith('.log')) continue
        log += `\n--- ${root}/${file} ---\n${await readFile(join(directory, file), 'utf8').catch(() => '')}`
      }
    }
    await writeFile(`${proof}.remote-error.log`, log.replaceAll(token, '<redacted>'))
    throw error
  } finally {
    clearTimeout(timer)
    try { await browser?.close() } finally {
      if (!local && child) { try { execFileSync('docker', ['rm', '-f', containerName], { stdio: 'ignore', timeout: 15_000 }) } catch {} }
      if (child) {
        const closed = once(child, 'close').catch(() => {})
        try { local ? process.kill(-child.pid, 'SIGTERM') : child.kill() } catch {}
        await Promise.race([closed, new Promise(resolveExit => setTimeout(resolveExit, 3000))])
        if (local) { try { process.kill(-child.pid, 'SIGKILL') } catch {} }
      }
      await rm(temporary, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = process.argv.slice(2)
  const option = key => args.includes(key) ? args[args.indexOf(key) + 1] : undefined
  for (const key of ['--vsix', '--target', '--publisher', '--proof', '--playwright-module']) assert.ok(option(key), `${key} is required`)
  console.log(JSON.stringify(await verifyRemoteVSIX({ vsix: resolve(option('--vsix')), target: option('--target'), publisher: option('--publisher'),
    proof: resolve(option('--proof')), playwrightModule: resolve(option('--playwright-module')), archivePath: option('--server-archive'), local: args.includes('--local') }), null, 2))
}
