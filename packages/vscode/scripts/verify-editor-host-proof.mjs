import assert from 'node:assert/strict'
import { SERVER_ARCHIVES, SERVER_COMMIT, SERVER_VERSION } from './verify-vsix-remote.mjs'

export function assertEditorHostProof(proof) {
  const host = proof.extensionHost
  assert.ok(host, 'Every VSIX requires an installed extension-host proof')
  assert.equal(host.id, `${proof.publisher}.master-css-vscode`)
  assert.equal(host.version, proof.version)
  assert.equal(host.vscode, SERVER_VERSION)
  for (const key of ['activated', 'completion', 'hover', 'restarted']) assert.equal(host[key], true, key)
  if (proof.target.startsWith('alpine-')) {
    assert.equal(host.kind, 'remote', 'Alpine requires the official remote Node extension host')
    assert.equal(host.remote?.platform, 'linux')
    assert.equal(host.remote.arch, proof.target.endsWith('arm64') ? 'arm64' : 'x64')
    assert.equal(host.remote.musl, true)
    assert.equal(host.remote.node.split('.')[0], '24')
    assert.equal(host.remote.uiKind, 2, 'The remote test must use the browser client')
    assert.ok(typeof host.remote.remoteName === 'string' && host.remote.remoteName.length > 0)
    assert.deepEqual(host.server, { version: SERVER_VERSION, commit: SERVER_COMMIT, ...SERVER_ARCHIVES[proof.target] })
  } else {
    assert.equal(host.kind, 'desktop')
    assert.equal(host.remote, null)
  }
}
