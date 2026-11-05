import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFile, readdir, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { assertUploadOwners } from './c10-editor-owners.mjs'

const [mode, productPath, evidencePath] = process.argv.slice(2)
assert.ok(['preflight', 'transport'].includes(mode))
const product = resolve(productPath), evidence = resolve(evidencePath)
const source = '6bf9adc4432b67e62613caea59d3b554711b4d54'
const version = '2.0.0', editor = '2.0.37'
const json = async file => JSON.parse(await readFile(file, 'utf8'))
const load = file => import(pathToFileURL(join(product, file)).href)
assert.equal(execFileSync('git', ['-C', product, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), source)
const manifest = await json(join(product, 'packages/vscode/package.json'))
assert.equal(manifest.version, editor)
const { verifyEditorEvidence } = await load('packages/vscode/scripts/verify-editor-evidence.mjs')
const hostEvidence = await verifyEditorEvidence({ candidateDir: join(evidence, 'candidate-vsix'),
  proofDir: join(evidence, 'editor-proofs'), revision: source, version: editor })
assert.deepEqual(hostEvidence, { revision: source, version: editor, archives: 16, desktopHosts: 12, remoteHosts: 4 })
for (const file of await readdir(join(evidence, 'editor-proofs'))) {
  assert.equal((await json(join(evidence, 'editor-proofs', file))).binding.bindingAbiVersion, 33)
}
const { verifyStoreAvailability } = await load('packages/vscode/scripts/verify-store-availability.mjs')
const availability = await verifyStoreAvailability(manifest)
assert.equal(availability.available, true)
const inventory = createHash('sha256').update(await readFile(join(evidence, 'candidate-vsix/inventory.json'))).digest('hex')

if (mode === 'preflight') {
  const provider = await json(join(evidence, 'provider-proof.json'))
  assert.equal(provider.source, source)
  assert.equal(provider.originalRun, 42053502169)
  assert.equal(provider.originalAttempt, 1)
  assert.ok(provider.originalNPM.ownerVerified && provider.recoveryNPM.ownerVerified)
  assert.equal(provider.editorOriginals.length, 9)
  assert.ok(provider.editorOriginals.every(item => item.ownerVerified))
  assert.equal(provider.recoveryNPM.logSHA256, provider.recoveryChain.at(-1).logSHA256)
  const { verifyRestoredEvidence } = await load('scripts/release-recovery-artifact.mjs')
  const request = { revision: source, version, channel: 'latest' }
  const originalDirectory = join(evidence, 'original-npm'), recoveryDirectory = join(evidence, 'recovered-npm')
  const original = await verifyRestoredEvidence(originalDirectory, request)
  const recovered = await verifyRestoredEvidence(recoveryDirectory, request)
  const identity = state => state.packages.map(({ name, archive, integrity, provenance }) => [name, archive, integrity, provenance]).sort()
  assert.deepEqual(identity(recovered), identity(original))
  assert.equal(original.run, '42053502169:1')
  assert.equal(recovered.run, original.run)
  assert.equal(original.channels.latest.complete, false)
  assertUploadOwners(original, recovered, provider)
  assert.ok((await readFile(join(originalDirectory, 'checksums.json'))).equals(await readFile(join(recoveryDirectory, 'checksums.json'))))
  const { readWorkspacePackages } = await load('scripts/site-toolchain-snapshot.mjs')
  const names = [...(await readWorkspacePackages(product)).values()]
    .filter(entry => !entry.manifest.private).map(entry => entry.manifest.name).sort()
  assert.equal(names.length, 34)
  const { registryFromState } = await load('scripts/pages-site-release.mjs')
  registryFromState(recovered, { revision: source, version, channel: 'main' }, names)
  const { releaseOutcome } = await load('scripts/release-outcome.mjs')
  assert.equal(releaseOutcome(recovered, { revision: source, branch: 'main', resolveTag: tag => {
    assert.equal(tag, 'v2.0.0')
    return execFileSync('git', ['-C', product, 'rev-parse', 'refs/tags/v2.0.0^{commit}'], { encoding: 'utf8' }).trim()
  } }).released, 'true')
  const { readPublishedPackage, readRegistryTags } = await load('scripts/semantic-release-promotion.mjs')
  const manifests = []
  for (const pkg of recovered.packages) {
    manifests.push(await readPublishedPackage({ ...pkg, gitHead: source }, version))
    assert.equal((await readRegistryTags(pkg.name)).latest, version)
  }
  const { assertReleaseProvenanceProof, verifyReleaseProvenance } = await load('scripts/release-registry-provenance.mjs')
  // Expected signed subject comes from the actual recovery receipt. The rc
  // delivery's process environment and GitHub token remain unchanged.
  const provenance = await verifyReleaseProvenance({ state: recovered, manifests,
    context: { env: { PATH: process.env.PATH, GITHUB_REF: provider.recoveryRef } } })
  assertReleaseProvenanceProof(recovered, provenance)
  const receipt = { source, version, editor, actualOperatorWorkflowSHA: process.env.GITHUB_SHA,
    provider, hostEvidence, availability, provenance, verifiedLatest: names, originalInventorySHA256: inventory,
    publicEditorPublicationPerformed: false }
  await writeFile(join(evidence, 'verified-inputs.json'), JSON.stringify(receipt, null, 2) + '\n', { mode: 0o600, flag: 'wx' })
} else {
  const verified = await json(join(evidence, 'verified-inputs.json'))
  assert.equal(verified.source, source)
  assert.equal(verified.version, version)
  assert.equal(verified.editor, editor)
  assert.equal(verified.actualOperatorWorkflowSHA, process.env.GITHUB_SHA)
  assert.equal(verified.provenance.cryptographicProvenanceVerified, true)
  assert.equal(verified.provenance.verifiedCount, 34)
  assert.equal(verified.verifiedLatest.length, 34)
  assert.equal(verified.originalInventorySHA256, inventory)
}
console.log(JSON.stringify({ mode, source, editor, archives: hostEvidence.archives, storeVersionsAvailable: true }))
