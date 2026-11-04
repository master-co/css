import { createHash } from 'node:crypto'
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from 'vitest'
import { TARGETS } from '../scripts/package-target-core.js'
import { SERVER_ARCHIVES, SERVER_COMMIT, SERVER_VERSION } from '../scripts/verify-vsix-remote.mjs'
import { verifyEditorEvidence } from '../scripts/verify-editor-evidence.mjs'

const revision = 'a'.repeat(40), version = '2.0.37'
async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'editor-evidence-'))
  const candidateDir = join(root, 'candidate'), proofDir = join(root, 'proofs')
  await mkdir(proofDir)
  const archives = []
  for (const publisher of ['masterco', 'master']) {
    await mkdir(join(candidateDir, publisher), { recursive: true })
    for (const target of TARGETS) {
      const filename = `master-css-vscode-${version}-${target}.vsix`
      // This check consumes an existing verified inventory, so opaque bytes are
      // enough to test artifact substitution without constructing sixteen ZIPs.
      const bytes = Buffer.from(`${publisher}/${target}`)
      const sha256 = createHash('sha256').update(bytes).digest('hex')
      await writeFile(join(candidateDir, publisher, filename), bytes)
      archives.push({ target, publisher, filename, sha256 })
      const arch = target.endsWith('arm64') ? 'aarch64' : 'x86_64'
      const abi = target.startsWith('darwin-') ? 'apple-darwin' : target.startsWith('win32-') ? 'pc-windows-msvc'
        : target.startsWith('alpine-') ? 'unknown-linux-musl' : 'unknown-linux-gnu'
      const alpine = target.startsWith('alpine-')
      const host = { id: `${publisher}.master-css-vscode`, version, vscode: SERVER_VERSION,
        kind: alpine ? 'remote' : 'desktop', activated: true, completion: true, hover: true, restarted: true,
        remote: alpine ? { platform: 'linux', arch: target.endsWith('arm64') ? 'arm64' : 'x64', musl: true,
          node: '24.15.0', uiKind: 2, remoteName: '127.0.0.1:1234' } : null }
      if (alpine) host.server = { version: SERVER_VERSION, commit: SERVER_COMMIT, ...SERVER_ARCHIVES[target] }
      await writeFile(join(proofDir, `${target}-${publisher}.json`), JSON.stringify({ schemaVersion: 1,
        revision, version, target, publisher, vsix: { sha256 }, binding: { surface: 'native', target: `${arch}-${abi}` },
        lsp: { shutdown: 0, completion: ':first-child' }, extensionHost: host }))
    }
  }
  await writeFile(join(candidateDir, 'inventory.json'), JSON.stringify({ schemaVersion: 1, revision, version, archives }))
  return { root, candidateDir, proofDir, revision, version }
}

async function withFixture(operation) {
  const input = await fixture()
  try { await operation(input) } finally { await rm(input.root, { recursive: true, force: true }) }
}
async function changeJSON(path, mutate) {
  const value = JSON.parse(await readFile(path, 'utf8'))
  mutate(value)
  await writeFile(path, JSON.stringify(value))
}

test('accepts only a complete same-revision sixteen-artifact inventory with real matching bytes and host proofs', async () => {
  await withFixture(async input => {
    await expect(verifyEditorEvidence(input)).resolves.toEqual({ revision, version, archives: 16, desktopHosts: 12, remoteHosts: 4 })
    await expect(verifyEditorEvidence({ ...input, revision: 'b'.repeat(40) })).rejects.toThrow()
    await expect(verifyEditorEvidence({ ...input, version: '2.0.38' })).rejects.toThrow()
  })
})

test('rejects a repacked, replaced, missing or extra VSIX before publication', async () => {
  for (const mutate of [
    path => writeFile(path, 'different build bytes'),
    path => rm(path),
    (_path, input) => writeFile(join(input.candidateDir, 'masterco/extra.vsix'), 'unexpected'),
    async (path, input) => {
      await rm(path)
      const outside = join(input.root, 'outside.vsix')
      await writeFile(outside, 'masterco/darwin-arm64')
      await symlink(outside, path, 'file')
    }
  ]) await withFixture(async input => {
    await mutate(join(input.candidateDir, `masterco/master-css-vscode-${version}-darwin-arm64.vsix`), input)
    await expect(verifyEditorEvidence(input)).rejects.toThrow()
  })
})

test('rejects duplicate inventory identities, unsafe filenames and wrong inventory checksums', async () => {
  for (const mutate of [
    data => { data.archives[0] = data.archives[1] },
    data => { data.archives[0].filename = '../outside.vsix' },
    data => { data.archives[0].sha256 = '0'.repeat(64) }
  ]) await withFixture(async input => {
    await changeJSON(join(input.candidateDir, 'inventory.json'), mutate)
    await expect(verifyEditorEvidence(input)).rejects.toThrow()
  })
})

test('rejects missing proofs, another candidate, wrong native target and native-only Alpine coverage', async () => {
  for (const mutate of [
    path => rm(path),
    path => changeJSON(path, data => { data.revision = 'b'.repeat(40) }),
    path => changeJSON(path, data => { data.vsix.sha256 = '0'.repeat(64) }),
    path => changeJSON(path, data => { data.binding.target = 'aarch64-unknown-linux-gnu' }),
    path => changeJSON(path, data => { data.extensionHost = null })
  ]) await withFixture(async input => {
    await mutate(join(input.proofDir, 'alpine-arm64-master.json'))
    await expect(verifyEditorEvidence(input)).rejects.toThrow()
  })
})
