import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { TARGETS, getRuntimePackagesForTarget, packageDir } from './package-target-core.js'

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')

export function assertCandidateSet(files, version) {
  assert.deepEqual(files.filter(file => file.endsWith('.vsix')).sort(),
    TARGETS.map(target => `master-css-vscode-${version}-${target}.vsix`).sort(),
    'Every publisher must have exactly the eight reviewed target archives, with the source version')
}

export async function verifyArchives({ marketplaceDir, openVSXDir, proof }) {
  const source = JSON.parse(await readFile(join(packageDir, 'package.json'), 'utf8'))
  const revision = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: packageDir, encoding: 'utf8' }).trim()
  if (process.env.GITHUB_SHA) assert.equal(revision, process.env.GITHUB_SHA)
  const temporary = await mkdtemp(join(tmpdir(), 'mcv-archives-'))
  const archives = []
  try {
    for (const [publisher, directory] of [['masterco', marketplaceDir], ['master', openVSXDir]]) {
      assertCandidateSet(await readdir(directory), source.version)
      for (const target of TARGETS) {
        const filename = `master-css-vscode-${source.version}-${target}.vsix`
        const file = join(directory, filename), extracted = join(temporary, `${publisher}-${target}`)
        await mkdir(extracted)
        if (process.platform === 'win32') execFileSync('tar', ['-xf', file, '-C', extracted])
        else execFileSync('unzip', ['-q', file, '-d', extracted])
        const root = join(extracted, 'extension')
        const manifest = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
        assert.equal(manifest.name, 'master-css-vscode')
        assert.equal(manifest.publisher, publisher)
        assert.equal(manifest.version, source.version)
        assert.deepEqual(manifest.engines, source.engines)
        const xml = await readFile(join(extracted, 'extension.vsixmanifest'), 'utf8')
        for (const attribute of [`TargetPlatform="${target}"`, `Version="${source.version}"`, `Publisher="${publisher}"`]) assert.ok(xml.includes(attribute), attribute)
        const nativePackage = getRuntimePackagesForTarget(target)[0].split('/')[1]
        const scope = join(root, 'dist/node_modules/@master')
        assert.deepEqual((await readdir(scope)).filter(name => name.startsWith('css-binding-')), [nativePackage])
        const nativeRoot = join(scope, nativePackage)
        const nativeManifest = JSON.parse(await readFile(join(nativeRoot, 'package.json'), 'utf8'))
        assert.equal(nativeManifest.name, `@master/${nativePackage}`)
        const payload = {}
        const sources = [
          ['dist/extension.min.js', join(packageDir, 'dist/extension.min.js')],
          ['dist/server.min.js', join(packageDir, 'dist/server.min.js')],
          ...['mastercss.node', target.startsWith('win32-') ? 'mcss.exe' : 'mcss'].map(name =>
            [`dist/node_modules/@master/${nativePackage}/${name}`, join(packageDir, '..', nativePackage.replace(/^css-/, ''), name)])
        ]
        for (const [relative, sourceFile] of sources) {
          const expected = sha256(await readFile(sourceFile))
          assert.equal(sha256(await readFile(join(root, relative))), expected, `Archive differs from validated build input: ${publisher}/${target}/${relative}`)
          payload[relative] = expected
        }
        archives.push({ target, publisher, filename, sha256: sha256(await readFile(file)), payload })
      }
    }
    const inventory = { schemaVersion: 1, revision, version: source.version, archives }
    await mkdir(dirname(proof), { recursive: true })
    await writeFile(proof, JSON.stringify(inventory, null, 2) + '\n')
    return inventory
  } finally { await rm(temporary, { recursive: true, force: true }) }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = process.argv.slice(2)
  const option = key => args.includes(key) ? args[args.indexOf(key) + 1] : undefined
  for (const key of ['--marketplace-dir', '--open-vsx-dir', '--proof']) assert.ok(option(key), `${key} is required`)
  console.log(JSON.stringify(await verifyArchives({ marketplaceDir: resolve(option('--marketplace-dir')),
    openVSXDir: resolve(option('--open-vsx-dir')), proof: resolve(option('--proof')) }), null, 2))
}
