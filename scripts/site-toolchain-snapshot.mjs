import { createHash } from 'node:crypto'
import { existsSync, globSync } from 'node:fs'
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { execa } from 'execa'
import { createWorkspaceRelease, packedManifest } from './semantic-release-workspace.mjs'
import { assertNpmOidcEnvironment } from './npm-oidc.mjs'

export const siteToolchainRoots = ['@master/css-astro', '@master/css-language-service', '@master/eslint-config-css']
const dependencyFields = ['dependencies', 'optionalDependencies', 'peerDependencies']

export function snapshotVersion(revision, sequence) {
  if (!/^[a-f0-9]{40}$/.test(revision)) throw new Error('Snapshot source must be a full Git commit SHA')
  if (!/^\d+(?:\.\d+)*$/.test(sequence)) throw new Error('Snapshot sequence must contain numeric identifiers')
  return `0.0.0-site.${sequence}.g${revision.slice(0, 12)}`
}

/** Runtime, optional native and workspace peer dependencies; build-only private helpers stay bundled. */
export function releaseClosure(packages, roots = siteToolchainRoots) {
  const result = [], visiting = new Set(), visited = new Set()
  function visit(name) {
    if (visited.has(name)) return
    const entry = packages.get(name)
    if (!entry) throw new Error(`Unknown snapshot package ${name}`)
    if (entry.manifest.private) throw new Error(`Private package cannot be published or imported: ${name}`)
    if (visiting.has(name)) throw new Error(`Circular snapshot dependency at ${name}`)
    visiting.add(name)
    for (const field of dependencyFields) {
      for (const [dependency, version] of Object.entries(entry.manifest[field] ?? {})) {
        if (packages.has(dependency)) visit(dependency)
        else if (version.startsWith('workspace:')) throw new Error(`Missing workspace dependency ${dependency}`)
      }
    }
    visiting.delete(name)
    visited.add(name)
    result.push(entry)
  }
  roots.forEach(visit)
  return result
}

export function snapshotManifest(manifest, names, version, revision) {
  const result = structuredClone(manifest)
  result.version = version
  result.gitHead = revision
  delete result.devDependencies
  delete result.scripts
  for (const field of dependencyFields) {
    for (const name of Object.keys(result[field] ?? {})) {
      if (names.has(name)) result[field][name] = version
      else if (/^(?:workspace:|file:|link:)/.test(result[field][name])) throw new Error(`Unpublishable dependency ${name}`)
    }
  }
  return result
}

export async function readWorkspacePackages(root) {
  const packages = new Map()
  for (const entry of await readdir(join(root, 'packages'), { withFileTypes: true })) {
    const directory = join(root, 'packages', entry.name)
    if (!entry.isDirectory() || !existsSync(join(directory, 'package.json'))) continue
    const manifest = JSON.parse(await readFile(join(directory, 'package.json'), 'utf8'))
    if (packages.has(manifest.name)) throw new Error(`Duplicate package ${manifest.name}`)
    packages.set(manifest.name, { directory, manifest })
  }
  return packages
}

function exportTargets(value) {
  if (typeof value === 'string') return [value]
  if (value && typeof value === 'object') return Object.values(value).flatMap(exportTargets)
  return []
}

/** Copy only publication inputs into a disposable workspace, never version the working checkout. */
export async function stageSnapshot(entries, stage, version, revision) {
  await mkdir(stage, { recursive: true })
  await writeFile(join(stage, 'package.json'), JSON.stringify({ private: true, workspaces: ['packages/*'] }))
  const names = new Set(entries.map(entry => entry.manifest.name))
  const roots = []
  for (const { directory, manifest } of entries) {
    if (!manifest.files?.length) throw new Error(`Missing publication files allowlist: ${manifest.name}`)
    // The generic loader resolves these development artifacts before optional
    // target packages. Shipping the build host's binaries breaks other hosts.
    if (manifest.name === '@master/css-binding' && existsSync(join(directory, 'artifacts'))) {
      throw new Error('Remove local development artifacts from @master/css-binding before packing; native binaries belong in target packages')
    }
    const root = `packages/${manifest.name.replace(/^@/, '').replaceAll('/', '-')}`
    const destination = join(stage, root)
    await mkdir(destination, { recursive: true })
    // Bun applies negated files patterns during pack; retain their positive parents here.
    const patterns = [...manifest.files.filter(file => !file.startsWith('!')), 'README*', 'LICENSE*']
    for (const file of new Set(patterns.flatMap(pattern => globSync(pattern, { cwd: directory })))) {
      const output = resolve(destination, file)
      if (relative(destination, output).startsWith('..')) throw new Error(`Publication file escapes package: ${file}`)
      await cp(join(directory, file), output, { recursive: true, dereference: true })
    }
    for (const target of exportTargets(manifest.exports)) {
      if (!target.startsWith('./') || !globSync(target, { cwd: destination }).length) {
        throw new Error(`Missing built export ${manifest.name}: ${target}`)
      }
    }
    for (const file of manifest.files.filter(file => /^(?:mastercss\.node|mcss(?:\.exe)?)$/.test(file))) {
      if (!existsSync(join(destination, file))) throw new Error(`Missing native artifact ${manifest.name}: ${file}`)
    }
    await writeFile(join(destination, 'package.json'), JSON.stringify(snapshotManifest(manifest, names, version, revision), null, 2) + '\n')
    roots.push(root)
  }
  return roots
}

export async function createSnapshot({ root, output, sequence, publish = false }) {
  if (publish) assertNpmOidcEnvironment(process.env)
  const revision = (await execa('git', ['rev-parse', 'HEAD'], { cwd: root })).stdout.trim()
  const dirty = (await execa('git', ['status', '--porcelain', '--untracked-files=no'], { cwd: root })).stdout
  if (dirty) throw new Error('Commit tracked changes before creating a source-pinned toolchain snapshot')
  const version = snapshotVersion(revision, sequence)
  const entries = releaseClosure(await readWorkspacePackages(root))
  const directory = resolve(output, version)
  const stage = join(directory, 'workspace')
  if (existsSync(directory)) throw new Error(`Snapshot output already exists: ${directory}`)
  const plugin = createWorkspaceRelease()
  try {
    const workspaceRoots = await stageSnapshot(entries, stage, version, revision)
    const context = { cwd: stage, env: process.env, stdout: process.stdout, stderr: process.stderr, nextRelease: { version, channel: 'site' } }
    const configurations = workspaceRoots.map(pkgRoot => ({ pkgRoot, workspaceRoots, tarballDir: join(directory, 'packages') }))
    const packages = []
    for (const config of configurations) {
      await plugin.prepare(config, context)
      const manifest = JSON.parse(await readFile(join(stage, config.pkgRoot, 'package.json')))
      const filename = `${manifest.name.replace(/^@/, '').replaceAll('/', '-')}-${version}.tgz`
      const bytes = await readFile(join(directory, 'packages', filename))
      const packed = packedManifest(bytes)
      for (const field of dependencyFields) {
        for (const entry of entries) {
          const dependency = packed[field]?.[entry.manifest.name]
          if (dependency && dependency !== version) throw new Error(`Snapshot dependency is not exact: ${manifest.name}`)
        }
      }
      packages.push({ name: manifest.name, version, file: `packages/${filename}`, integrity: `sha512-${createHash('sha512').update(bytes).digest('base64')}` })
    }
    const manifest = { schemaVersion: 1, source: { repository: 'https://github.com/master-co/css', revision }, version, tag: 'site', roots: siteToolchainRoots, packages }
    await writeFile(join(directory, 'snapshot.json'), JSON.stringify(manifest, null, 2) + '\n')
    // Pack and verify the whole closure before the first external mutation.
    if (publish) for (const config of configurations) await plugin.publish(config, context)
    await writeFile(join(directory, publish ? 'published.json' : 'packed.json'), JSON.stringify({ revision, version, packages: packages.length }) + '\n')
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
  const sequence = option('--sequence', process.env.GITHUB_RUN_ID ? `${process.env.GITHUB_RUN_ID}.${process.env.GITHUB_RUN_ATTEMPT ?? '1'}` : undefined)
  if (!sequence) throw new Error('Pass --sequence <number> (GitHub Actions uses run ID and attempt)')
  const manifest = await createSnapshot({ root, output: option('--output', join(root, '.cache/site-toolchains')), sequence, publish: args.includes('--publish') })
  console.log(JSON.stringify({ version: manifest.version, revision: manifest.source.revision, packages: manifest.packages.length }))
}
