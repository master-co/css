import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { lstat, readFile, readdir } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { TARGETS, packageDir } from './package-target-core.js'
import { assertEditorHostProof } from './verify-editor-host-proof.mjs'

const publishers = ['masterco', 'master']
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
async function regularFile(path) {
  assert.ok((await lstat(path)).isFile(), `Expected a regular evidence file: ${path}`)
  return readFile(path)
}

// Both the verification gate and publication check the same downloaded bytes.
// GitHub's same-run artifact transport supplies provenance; this verifies their
// complete inventory and host proofs without rebuilding or executing the VSIX.
export async function verifyEditorEvidence({ candidateDir, proofDir, revision, version }) {
  assert.match(revision, /^[a-f0-9]{40}$/, 'An exact candidate revision is required')
  assert.ok(typeof version === 'string' && version.length > 0)
  assert.deepEqual((await readdir(candidateDir)).sort(), ['inventory.json', 'master', 'masterco'])
  const inventory = JSON.parse(await regularFile(join(candidateDir, 'inventory.json')))
  assert.equal(inventory.schemaVersion, 1)
  assert.equal(inventory.revision, revision)
  assert.equal(inventory.version, version)
  const identities = TARGETS.flatMap(target => publishers.map(publisher => `${target}-${publisher}`)).sort()
  assert.deepEqual(inventory.archives.map(item => `${item.target}-${item.publisher}`).sort(), identities,
    'The inventory must contain every target and publisher exactly once')
  assert.deepEqual((await readdir(proofDir)).sort(), identities.map(id => `${id}.json`))
  const files = TARGETS.map(target => `master-css-vscode-${version}-${target}.vsix`).sort()
  for (const publisher of publishers) {
    assert.ok((await lstat(join(candidateDir, publisher))).isDirectory(), 'Publisher paths must be real directories')
    assert.deepEqual((await readdir(join(candidateDir, publisher))).sort(), files)
    for (const target of TARGETS) {
      const filename = `master-css-vscode-${version}-${target}.vsix`
      const archive = inventory.archives.find(item => item.target === target && item.publisher === publisher)
      assert.equal(archive.filename, filename)
      const digest = sha256(await regularFile(join(candidateDir, publisher, filename)))
      assert.equal(digest, archive.sha256, `Downloaded VSIX differs from the tested artifact: ${publisher}/${target}`)
      const proof = JSON.parse(await regularFile(join(proofDir, `${target}-${publisher}.json`)))
      assert.equal(proof.schemaVersion, 1)
      assert.equal(proof.revision, revision)
      assert.equal(proof.target, target)
      assert.equal(proof.publisher, publisher)
      assert.equal(proof.version, version)
      assert.equal(proof.vsix.sha256, digest)
      assert.equal(proof.binding.surface, 'native')
      const arch = target.endsWith('arm64') ? 'aarch64' : 'x86_64'
      const abi = target.startsWith('darwin-') ? 'apple-darwin' : target.startsWith('win32-') ? 'pc-windows-msvc'
        : target.startsWith('alpine-') ? 'unknown-linux-musl' : 'unknown-linux-gnu'
      assert.equal(proof.binding.target, `${arch}-${abi}`)
      assert.equal(proof.lsp.shutdown, 0)
      assert.equal(proof.lsp.completion, ':first-child')
      assertEditorHostProof(proof)
    }
  }
  return { revision, version, archives: identities.length, desktopHosts: 12, remoteHosts: 4 }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = process.argv.slice(2)
  const option = key => args.includes(key) ? args[args.indexOf(key) + 1] : undefined
  for (const key of ['--candidate-dir', '--proof-dir']) assert.ok(option(key), `${key} is required`)
  const source = JSON.parse(await readFile(join(packageDir, 'package.json'), 'utf8'))
  console.log(JSON.stringify(await verifyEditorEvidence({ candidateDir: resolve(option('--candidate-dir')),
    proofDir: resolve(option('--proof-dir')), revision: process.env.GITHUB_SHA, version: source.version }), null, 2))
}
