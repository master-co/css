import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, readdir, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { readWorkspacePackages } from './site-toolchain-snapshot.mjs'
import { packedManifest, validatePackedArchive } from './semantic-release-workspace.mjs'

const registry = 'https://registry.npmjs.org/'
const integrity = bytes => `sha512-${createHash('sha512').update(bytes).digest('base64')}`
const versionPattern = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/

/** Read public registry metadata only. A 404 is absence, never proof of ownership. */
export async function inventory(names, version, fetchMetadata = fetch) {
  assert.match(version, versionPattern)
  const packages = []
  for (const name of [...names].sort()) {
    const response = await fetchMetadata(`${registry}${encodeURIComponent(name)}`, {
      headers: { accept: 'application/vnd.npm.install-v1+json' }, signal: AbortSignal.timeout(15_000)
    })
    assert.ok(response.ok || response.status === 404, `Registry request failed: ${name}: ${response.status}`)
    const metadata = response.status === 404 ? {} : await response.json()
    const candidate = metadata.versions?.[version]
    packages.push({ name, status: response.status, tags: metadata['dist-tags'] ?? {},
      candidate: candidate ? { version: candidate.version, integrity: candidate.dist?.integrity ?? null,
        tarball: candidate.dist?.tarball ?? null } : null })
  }
  return { schemaVersion: 1, sampledAt: new Date().toISOString(), registry, version, packages }
}

/** All public workspace archives, with exact candidate dependencies; no build or publish. */
export async function inspectArchives(directory, names, version, revision) {
  assert.match(version, versionPattern)
  assert.match(revision, /^[a-f0-9]{40}$/)
  const expected = new Set(names)
  const packages = []
  for (const filename of (await readdir(directory)).filter(name => name.endsWith('.tgz')).sort()) {
    const bytes = await readFile(join(directory, filename))
    const manifest = packedManifest(bytes)
    assert.ok(expected.has(manifest.name), `Unexpected archive ${manifest.name}`)
    validatePackedArchive(bytes, manifest.name, version)
    const dependencies = new Set()
    for (const field of ['dependencies', 'optionalDependencies', 'peerDependencies']) {
      for (const [name, dependency] of Object.entries(manifest[field] ?? {})) {
        if (!expected.has(name)) continue
        assert.equal(dependency, version, `${manifest.name}: ${field}.${name} must pin ${version}`)
        if (field !== 'peerDependencies') dependencies.add(name)
      }
    }
    packages.push({ name: manifest.name, version, file: filename, integrity: integrity(bytes),
      dependencies: [...dependencies].sort() })
  }
  assert.deepEqual(packages.map(pkg => pkg.name).sort(), [...expected].sort(), 'Require exactly one archive per public workspace')
  return { schemaVersion: 1, revision, version, packages: dependencyOrder(packages) }
}

export function dependencyOrder(packages) {
  const remaining = new Map(packages.map(pkg => [pkg.name, pkg]))
  assert.equal(remaining.size, packages.length, 'Duplicate package')
  const ordered = []
  while (remaining.size) {
    const ready = [...remaining.values()].filter(pkg => (pkg.dependencies ?? []).every(name => !remaining.has(name)))
      .sort((a, b) => a.name.localeCompare(b.name))
    assert.ok(ready.length, 'Runtime dependency cycle prevents ordered publication')
    for (const pkg of ready) { ordered.push(pkg); remaining.delete(pkg.name) }
  }
  return ordered
}

function indexed(snapshot, candidate) {
  assert.equal(snapshot.version, candidate.version, 'Registry snapshot must inspect the same candidate version')
  assert.equal(snapshot.registry, registry, 'Only the public npm registry is supported')
  assert.deepEqual(snapshot.packages.map(pkg => pkg.name).sort(), candidate.packages.map(pkg => pkg.name).sort(), 'Registry snapshot package cohort differs')
  return new Map(snapshot.packages.map(pkg => [pkg.name, pkg]))
}

/** A plan is evidence for an operator, not authorization or an executable script. */
export function planRecovery(candidate, before, current, stableTag = 'latest') {
  assert.match(candidate.version, versionPattern)
  assert.match(stableTag, /^[a-z][a-z0-9-]*$/)
  const original = indexed(before, candidate)
  const observed = indexed(current, candidate)
  const packages = dependencyOrder(candidate.packages).map(pkg => {
    assert.equal(pkg.version, candidate.version)
    assert.match(pkg.integrity, /^sha512-[A-Za-z0-9+/]+={0,2}$/)
    const now = observed.get(pkg.name)
    const priorTag = original.get(pkg.name).tags[stableTag] ?? null
    const currentTag = now.tags[stableTag] ?? null
    const exists = now.candidate !== null
    const identical = exists && now.candidate.version === candidate.version && now.candidate.integrity === pkg.integrity
    const conflict = exists && !identical
    const tagConflict = currentTag !== priorTag && currentTag !== candidate.version
    return { name: pkg.name, version: pkg.version, integrity: pkg.integrity,
      upload: conflict ? 'BLOCK-immutable-version-conflict' : exists ? 'verify-existing-provenance-and-consumers' : 'needs-staged-upload',
      promote: conflict || tagConflict || !exists ? 'blocked' : currentTag === candidate.version ? 'already-promoted' : 'ready-after-all-gates',
      rollback: tagConflict ? 'BLOCK-concurrent-tag-change' : currentTag !== candidate.version || priorTag === candidate.version ? 'no-change'
        : priorTag === null ? 'remove-candidate-tag' : 'restore-prior-tag', priorTag, currentTag }
  })
  return { schemaVersion: 1, mode: 'read-only-plan', version: candidate.version, revision: candidate.revision,
    stableTag, registryComplete: packages.every(pkg => pkg.upload === 'verify-existing-provenance-and-consumers'),
    promotionBlocked: packages.some(pkg => pkg.promote === 'blocked'),
    additionalGates: ['Verify provenance and candidate revision', 'Fresh registry-only consumer installs',
      'Eight native targets, Wasm and browser/CDN checks', 'Explicit publication and promotion authorization'], packages }
}

/** Exercise every interrupted upload and tag boundary in memory, never against npm. */
export function rehearse(candidate, before) {
  indexed(before, candidate)
  for (const pkg of before.packages) {
    assert.equal(pkg.candidate, null, 'Rehearsal requires the pre-publication registry snapshot')
    assert.notEqual(pkg.tags.latest, candidate.version, 'Rehearsal baseline must precede candidate promotion')
  }
  const steps = []
  const ordered = dependencyOrder(candidate.packages)
  for (let boundary = 0; boundary <= ordered.length; boundary++) {
    const uploaded = new Set(ordered.slice(0, boundary).map(pkg => pkg.name))
    const current = structuredClone(before)
    for (const pkg of current.packages) {
      const artifact = ordered.find(item => item.name === pkg.name)
      pkg.candidate = uploaded.has(pkg.name) ? { version: candidate.version, integrity: artifact.integrity } : null
    }
    const plan = planRecovery(candidate, before, current)
    assert.equal(plan.registryComplete, boundary === ordered.length)
    steps.push({ phase: 'upload', interruptedAfter: boundary, pending: ordered.length - boundary })
  }
  for (let boundary = 0; boundary <= ordered.length; boundary++) {
    const promoted = new Set(ordered.slice(0, boundary).map(pkg => pkg.name))
    const current = structuredClone(before)
    for (const pkg of current.packages) {
      const artifact = ordered.find(item => item.name === pkg.name)
      pkg.candidate = { version: candidate.version, integrity: artifact.integrity }
      if (promoted.has(pkg.name)) pkg.tags.latest = candidate.version
    }
    const plan = planRecovery(candidate, before, current)
    assert.equal(plan.promotionBlocked, false)
    assert.equal(plan.packages.filter(pkg => pkg.promote === 'already-promoted').length, boundary)
    steps.push({ phase: 'promotion', interruptedAfter: boundary,
      rollback: plan.packages.filter(pkg => pkg.rollback !== 'no-change').map(pkg => ({ name: pkg.name, action: pkg.rollback, priorTag: pkg.priorTag })) })
  }
  return { mode: 'in-memory-rehearsal', version: candidate.version, packageCount: ordered.length, steps }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [command, ...args] = process.argv.slice(2)
  const option = name => args.includes(name) ? args[args.indexOf(name) + 1] : undefined
  const json = async name => JSON.parse(await readFile(option(name), 'utf8'))
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  let result
  if (command === 'inventory' || command === 'inspect') {
    const workspace = await readWorkspacePackages(root)
    const names = [...workspace.values()].filter(entry => !entry.manifest.private).map(entry => entry.manifest.name)
    result = command === 'inventory' ? await inventory(names, option('--version'))
      : await inspectArchives(resolve(option('--archives')), names, option('--version'), option('--revision'))
  } else if (command === 'plan') {
    result = planRecovery(await json('--candidate'), await json('--before'), await json('--current'), option('--tag'))
  } else if (command === 'rehearse') {
    result = rehearse(await json('--candidate'), await json('--before'))
  } else throw new Error('Use inventory, inspect, plan or rehearse; all modes are read-only except the requested JSON output file')
  const output = JSON.stringify(result, null, 2) + '\n'
  if (option('--output')) await writeFile(option('--output'), output, { flag: 'wx' })
  else process.stdout.write(output)
}
