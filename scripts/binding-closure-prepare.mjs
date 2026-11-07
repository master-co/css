import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { readWorkspacePackages, releaseClosure, stageSnapshot } from './site-toolchain-snapshot.mjs'
import { createWorkspaceRelease, packedManifest, validatePackedArchive } from './release-workspace.mjs'

const targetPattern = /^@master\/css-binding-(?:darwin|linux|win32)-/
const fields = ['dependencies', 'optionalDependencies', 'peerDependencies']
export const integrity = bytes => `sha512-${createHash('sha512').update(bytes).digest('base64')}`

/** Prepare real release archives once; native target binaries are supplied by each runner. */
export async function prepareClosure({ root, output, version = '0.0.0-closure.0' }) {
  assert.match(version, /^\d+\.\d+\.\d+-closure\.\d+(?:\.\d+)*$/, 'Use an unpublished closure version')
  assert.equal(existsSync(output), false, 'Closure output must be a fresh directory')
  const revision = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()
  const workspace = await readWorkspacePackages(root)
  const roots = ['@master/css']
  const closure = releaseClosure(workspace, roots)
  const entries = closure.filter(entry => !targetPattern.test(entry.manifest.name))
  const targets = closure.filter(entry => targetPattern.test(entry.manifest.name)).map(entry => entry.manifest.name).sort()
  assert.equal(targets.length, 8, 'The closure must include all eight native targets')
  const stage = join(output, 'workspace')
  const plugin = createWorkspaceRelease()
  await mkdir(output, { recursive: true })
  try {
    const stagedEntries = entries.map(entry => {
      const manifest = structuredClone(entry.manifest)
      for (const field of fields) {
        for (const name of Object.keys(manifest[field] ?? {})) {
          if (targetPattern.test(name)) manifest[field][name] = version
        }
      }
      return { ...entry, manifest }
    })
    const workspaceRoots = await stageSnapshot(stagedEntries, stage, version, revision)
    // Target packages have no binaries on the preparation host. Their manifests still
    // participate in normal prepare's workspace version resolution.
    for (const name of targets) {
      const pkgRoot = `packages/${name.replace(/^@/, '').replaceAll('/', '-')}`
      await mkdir(join(stage, pkgRoot), { recursive: true })
      await writeFile(join(stage, pkgRoot, 'package.json'), JSON.stringify({ ...workspace.get(name).manifest, version }))
      workspaceRoots.push(pkgRoot)
    }
    const bindingRoot = join(stage, 'packages/master-css-binding')
    await mkdir(join(bindingRoot, 'artifacts'), { recursive: true })
    for (const name of ['mastercss.node', 'mcss', 'mcss.exe']) {
      await writeFile(join(bindingRoot, 'artifacts', name), `POISON build-host artifact: ${name}\n`)
    }
    const context = { cwd: stage, env: process.env, nextRelease: { version, gitHead: revision } }
    const packages = []
    for (const entry of entries) {
      const pkgRoot = `packages/${entry.manifest.name.replace(/^@/, '').replaceAll('/', '-')}`
      await plugin.prepare({ pkgRoot, workspaceRoots, tarballDir: join(output, 'packages') }, context)
      const file = `packages/${entry.manifest.name.replace(/^@/, '').replaceAll('/', '-')}-${version}.tgz`
      const bytes = await readFile(join(output, file))
      validatePackedArchive(bytes, entry.manifest.name, version)
      const packed = packedManifest(bytes)
      for (const field of fields) {
        for (const [name, dependency] of Object.entries(packed[field] ?? {})) {
          if (workspace.has(name)) assert.equal(dependency, version, `${packed.name} must pin candidate ${name}`)
        }
      }
      packages.push({ name: packed.name, version, file, integrity: integrity(bytes) })
    }
    assert.equal(await readFile(join(bindingRoot, 'artifacts/mastercss.node'), 'utf8'), 'POISON build-host artifact: mastercss.node\n')
    const manifest = { schemaVersion: 1, revision, version, roots, targets, packages, poisonArtifactsExcluded: true }
    await writeFile(join(output, 'closure.json'), JSON.stringify(manifest, null, 2) + '\n')
    return manifest
  } finally {
    await plugin.fail()
    await rm(stage, { recursive: true, force: true })
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = process.argv.slice(2)
  const option = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  assert.ok(option('--output'), 'Pass --output <fresh-directory>')
  const manifest = await prepareClosure({ root, output: resolve(option('--output')), version: option('--version') })
  console.log(JSON.stringify(manifest, null, 2))
}
