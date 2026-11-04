import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import { assertEditorHostProof } from '../scripts/verify-editor-host-proof.mjs'
import { SERVER_ARCHIVES, SERVER_COMMIT, SERVER_VERSION, remoteTestURL, validateServerMetadata } from '../scripts/verify-vsix-remote.mjs'

const target = 'alpine-arm64'
const server = { version: SERVER_VERSION, commit: SERVER_COMMIT, ...SERVER_ARCHIVES[target] }
const proof = () => ({ target, publisher: 'masterco', version: '2.0.37', extensionHost: {
  id: 'masterco.master-css-vscode', version: '2.0.37', vscode: SERVER_VERSION, kind: 'remote',
  activated: true, completion: true, hover: true, restarted: true, server,
  remote: { platform: 'linux', arch: 'arm64', musl: true, node: '24.15.0', uiKind: 2, remoteName: 'localhost:1234' }
} })

test('official remote server metadata must match the reviewed version, commit, target and checksum', () => {
  const metadata = { version: SERVER_COMMIT, productVersion: SERVER_VERSION, sha256hash: server.sha256,
    url: `https://vscode.download.prss.microsoft.com/dbazure/download/stable/${SERVER_COMMIT}/vscode-server-alpine-arm64-web.tar.gz` }
  expect(() => validateServerMetadata(metadata, target)).not.toThrow()
  for (const wrong of [{ version: 'a'.repeat(40) }, { productVersion: '1.120.0' }, { sha256hash: '0'.repeat(64) },
    { url: metadata.url.replace('vscode.download.prss.microsoft.com', 'example.com') },
    { url: metadata.url.replace('alpine-arm64', 'linux-alpine') }]) {
    expect(() => validateServerMetadata({ ...metadata, ...wrong }, target)).toThrow()
  }
  expect(() => validateServerMetadata(metadata, 'linux-x64')).toThrow('No reviewed official server')
})

test('remote test URLs use only loopback and the actual remote driver paths', () => {
  const url = new URL(remoteTestURL('http://127.0.0.1:4321/?tkn=fixture', '/verification'))
  expect(url.searchParams.get('tkn')).toBe('fixture')
  expect(url.searchParams.get('folder')).toBe('/verification/workspace')
  expect(JSON.parse(url.searchParams.get('payload'))).toContainEqual(['extensionTestsPath', 'vscode-remote://127.0.0.1:4321/verification/driver/test.cjs'])
  for (const endpoint of ['https://public.example', 'http://0.0.0.0:4321', 'http://192.0.2.1:4321']) {
    expect(() => remoteTestURL(endpoint, '/verification')).toThrow()
  }
})

test('the final gate rejects native-only, desktop, wrong-runtime and stale-server Alpine proofs', () => {
  expect(() => assertEditorHostProof(proof())).not.toThrow()
  const variants = [p => { p.extensionHost = null }, p => { p.extensionHost.kind = 'desktop' },
    p => { p.extensionHost.vscode = '1.120.0' },
    p => { p.extensionHost.remote.musl = false }, p => { p.extensionHost.remote.arch = 'x64' },
    p => { p.extensionHost.remote.node = '22.22.1' }, p => { p.extensionHost.server.commit = 'a'.repeat(40) },
    p => { p.extensionHost.server.sha256 = '0'.repeat(64) }, p => { p.extensionHost.restarted = false }]
  for (const change of variants) {
    const altered = structuredClone(proof())
    change(altered)
    expect(() => assertEditorHostProof(altered)).toThrow()
  }
})

test('desktop and remote verification agree with the source minimum supported VS Code version', () => {
  const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
  expect(manifest.engines.vscode).toBe(`^${SERVER_VERSION}`)
  const desktop = proof()
  desktop.target = 'darwin-arm64'
  desktop.extensionHost.kind = 'desktop'
  desktop.extensionHost.remote = null
  delete desktop.extensionHost.server
  expect(() => assertEditorHostProof(desktop)).not.toThrow()
  desktop.extensionHost.vscode = '1.120.0'
  expect(() => assertEditorHostProof(desktop)).toThrow()
})
