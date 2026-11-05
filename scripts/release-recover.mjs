import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { execa } from 'execa'
import { createReleasePromotion, stagePackage, assertReleaseFlag } from './semantic-release-promotion.mjs'
import { packedManifest, validatePackedArchive } from './semantic-release-workspace.mjs'
import { readWorkspacePackages, releaseClosure } from './site-toolchain-snapshot.mjs'
import { dependencyOrder, publishedDependencies } from './release-readiness.mjs'
import { assertNpmPublishConfig, createNpmOidcSession, npmRegistry } from './npm-oidc.mjs'

/** Explicit recovery only: no semantic-release version selection, Git writes or deployment. */
export async function recoverRelease({ root, stateFile, channel, scope = 'workspace', environment = process.env,
  run = execa, fetchMetadata = fetch, consumerProbe, provenanceProbe }) {
  const context = { cwd: root, env: { ...environment, MASTER_CSS_RELEASE_STATE: resolve(stateFile) } }
  for (const flag of ['MASTER_CSS_RELEASE_STAGE', 'MASTER_CSS_RELEASE_PROMOTE', 'MASTER_CSS_RELEASE_RECOVERY']) assertReleaseFlag(context, flag)
  const state = JSON.parse(await readFile(stateFile))
  assert.match(channel, /^[a-z][a-z0-9-]*$/)
  assert.ok(['workspace', 'site'].includes(scope), 'Recovery scope must be workspace or site')
  if (scope === 'site') assert.equal(channel, 'site', 'Snapshot recovery cannot move stable channels')
  assert.equal(environment.GITHUB_SHA, state.revision, 'Recovery must run the original source revision')
  context.nextRelease = { version: state.version, gitHead: state.revision, channel }
  const workspace = await readWorkspacePackages(root)
  const entries = scope === 'site' ? releaseClosure(workspace) : [...workspace.values()].filter(entry => !entry.manifest.private)
  assert.deepEqual(entries.map(entry => entry.manifest.name).sort(), state.packages.map(pkg => pkg.name).sort(), 'Recovery scope must contain the complete original cohort')
  // Map the immutable package identities back to this checkout's source roots;
  // snapshot preparation's deleted temporary workspace is never required.
  const config = { workspaceRoots: entries.map(entry => relative(root, entry.directory)) }
  const publishedNames = new Set(entries.map(({ manifest }) => manifest.name))
  const packages = []
  for (const item of state.packages) {
    const archive = resolve(dirname(stateFile), item.archive)
    const bytes = await readFile(archive)
    validatePackedArchive(bytes, item.name, state.version, state.revision)
    const pkg = packedManifest(bytes)
    packages.push({ name: pkg.name, pkg, archive, dependencies: publishedDependencies(pkg, publishedNames) })
  }
  const executeNpm = async (pkg, args) => {
    assertNpmPublishConfig(pkg)
    const session = await createNpmOidcSession(context.env)
    try {
      const { cleanup, ...options } = session
      await run('npm', [...args, '--registry', npmRegistry], options)
    } finally { await session.cleanup() }
  }
  for (const item of dependencyOrder(packages)) {
    await stagePackage(config, context, item.pkg, item.archive, executeNpm, fetchMetadata)
  }
  return createReleasePromotion({ run, fetchMetadata, consumerProbe, provenanceProbe }).publish(config, context)
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = process.argv.slice(2)
  const option = name => args.includes(name) ? args[args.indexOf(name) + 1] : undefined
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  assert.equal(execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(), process.env.GITHUB_SHA,
    'Recovery checkout must match the authorized workflow revision')
  assert.ok(option('--state') && option('--channel'), 'Pass --state <archived-state.json> --channel <formal-channel> [--scope site]')
  console.log(JSON.stringify(await recoverRelease({ root, stateFile: resolve(option('--state')), channel: option('--channel'), scope: option('--scope') })))
}
