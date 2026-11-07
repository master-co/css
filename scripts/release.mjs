// Releases the checked-out commit of a release branch. Aronrepo decides the version,
// tag and notes from the commits (the same resolver as `aronrepo check` and
// `aronrepo explain`); this repository's workspace and promotion modules stage,
// verify and promote the npm cohort; Aronrepo then creates the GitHub release.
import { appendFile, mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import semver from 'semver'
import { parseVersionTag } from 'aronrepo'
import { planRelease, publishGitHubRelease, runCommand } from 'aronrepo/node'
import { readPackage } from './release-manifest.mjs'
import { releasePackageRoots } from './release-order.mjs'
import { createReleasePromotion, readRegistryTags } from './release-promotion.mjs'
import { createWorkspaceRelease } from './release-workspace.mjs'

/** The complete notes, attached to the GitHub release because its body is bounded. */
export const releaseNotesPath = 'release-artifacts/release-notes.md'

async function writeNotes(cwd, notes) {
  const file = join(cwd, releaseNotesPath)
  await mkdir(dirname(file), { recursive: true })
  await writeFile(file, notes)
}

function describe(plan) {
  return [
    `Branch: ${plan.branch}${plan.channel ? ` (npm dist-tag ${plan.channel.distTag})` : ''}`,
    `Range: ${plan.from ? `${plan.from}..` : 'all commits up to '}${plan.head.slice(0, 9)}`,
    ...plan.commits.map(decision => `  ${(decision.release || 'none').padEnd(5)} ${decision.hash?.slice(0, 9) ?? ''} ${decision.header}`),
    `Release: ${plan.release || 'none'}${plan.version ? ` → ${plan.version}` : ''}`
  ].join('\n')
}

/**
 * Finishes a release whose tag is on HEAD: creates its GitHub release once every
 * package's channel already points to the version. An incomplete npm phase is
 * resumed only by the workflow's archived-state npm recovery mode.
 */
async function resume(environment, plan, roots, fetchMetadata) {
  const channel = plan.channel
  const tags = (await environment.run('git', ['tag', '--list', 'v*', '--points-at', 'HEAD'], environment)).stdout.split('\n').map(tag => tag.trim())
  const tag = tags.find(candidate => {
    const version = parseVersionTag(candidate)
    return version && (channel.prerelease ? semver.prerelease(version)?.[0] === channel.prerelease : !semver.prerelease(version))
  })
  if (!tag) {
    environment.log('No release.')
    return { status: 'none', plan }
  }
  const version = parseVersionTag(tag)
  for (const root of roots) {
    const { name } = await readPackage(environment.cwd, root)
    const current = (await readRegistryTags(name, fetchMetadata))[channel.distTag]
    if (current !== version) {
      environment.log(`${tag} is on HEAD, but ${name}@${channel.distTag} is ${current ?? 'unset'}. Resume npm with the Release workflow's npm recovery mode before the GitHub release.`)
      return { status: 'none', plan }
    }
  }
  const tagged = await planRelease({ ignoreTags: [tag], version }, environment)
  if (!tagged.notes) return { status: 'none', plan }
  environment.log(`${tag} is on HEAD and every package is on ${channel.distTag}; make sure its GitHub release exists.`)
  await writeNotes(environment.cwd, tagged.notes)
  await publishGitHubRelease(environment, {
    tag,
    notes: tagged.notes,
    prerelease: Boolean(channel.prerelease),
    target: plan.head,
    ...(plan.assets ? { assets: plan.assets } : {})
  })
  return { status: 'resumed', plan: tagged }
}

export async function release({
  dryRun = false,
  githubOutput,
  branch,
  cwd = process.cwd(),
  env = process.env,
  log = message => console.log(message),
  run = runCommand,
  fetch: fetchApi = fetch,
  fetchMetadata = fetch,
  workspace = createWorkspaceRelease(),
  promotion = createReleasePromotion()
} = {}) {
  const environment = { cwd, env, run, fetch: fetchApi, log, wait: ms => new Promise(resolve => setTimeout(resolve, ms)) }
  const git = async args => (await run('git', args, { cwd, env })).stdout.trim()
  const plan = await planRelease(branch ? { branch } : {}, environment)
  log(describe(plan))
  if (!plan.channel) {
    log(`Branch ${plan.branch} does not release. Release branches: main, alpha, beta, rc, canary.`)
    return { status: 'skipped', plan }
  }
  const roots = releasePackageRoots(cwd)
  if (dryRun) {
    // Later workflow steps, such as the editor version gate, run only for an actual release.
    if (githubOutput) await appendFile(githubOutput, `release=${plan.release || ''}\nversion=${plan.version ?? ''}\ntag=${plan.tag ?? ''}\n`)
    log(plan.version
      ? `\nDry run: would release ${plan.tag} of ${roots.length} packages on ${plan.channel.distTag}.\n\n${plan.notes}`
      : '\nDry run: no release.')
    return { status: 'dry-run', plan }
  }
  if (!plan.version) return await resume(environment, plan, roots, fetchMetadata)
  if (await git(['tag', '--list', plan.tag])) {
    throw new Error(`${plan.tag} exists but is not reachable from ${plan.branch}; recover that release explicitly instead of releasing it again.`)
  }

  const context = {
    cwd,
    env,
    logger: { log, error: log },
    stdout: process.stdout,
    stderr: process.stderr,
    // `channel` is the prerelease dist-tag; the main channel is npm's `latest`.
    nextRelease: {
      type: plan.release,
      version: plan.version,
      gitTag: plan.tag,
      gitHead: plan.head,
      notes: plan.notes,
      ...(plan.channel.prerelease ? { channel: plan.channel.distTag } : {})
    },
    lastRelease: plan.from ? { gitTag: plan.from } : {}
  }
  const configs = roots.map(pkgRoot => ({ pkgRoot, workspaceRoots: roots }))
  const cohort = { workspaceRoots: roots }
  try {
    for (const config of configs) await workspace.verifyConditions(config, context)
    await promotion.verifyConditions(cohort, context)
    // Rejects known registry collisions before the tag exists.
    await promotion.verifyRelease(cohort, context)
    await writeNotes(cwd, plan.notes)
    for (const config of configs) await workspace.prepare(config, context)
    // The tag precedes npm, so an interrupted npm phase never releases the same
    // commit again; release-recover.mjs resumes it from the archived state.
    await git(['-c', 'tag.gpgSign=false', 'tag', plan.tag, plan.head])
    await git(['push', '--no-verify', 'origin', `refs/tags/${plan.tag}`])
    log(`✓ Pushed ${plan.tag}`)
    for (const config of configs) await workspace.publish(config, context)
    await promotion.publish(cohort, context)
  } finally {
    await workspace.success()
  }
  await publishGitHubRelease(environment, {
    tag: plan.tag,
    notes: plan.notes,
    prerelease: Boolean(plan.channel.prerelease),
    target: plan.head,
    ...(plan.assets ? { assets: plan.assets } : {})
  })
  return { status: 'released', plan }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  // `--dry-run` prints the plan and notes without verifying, packing or writing anything;
  // `--github-output` also writes `release`, `version` and `tag` to $GITHUB_OUTPUT;
  // `--branch <name>` plans as that release branch, such as `main` from a feature branch.
  const branchIndex = process.argv.indexOf('--branch')
  release({
    dryRun: process.argv.includes('--dry-run'),
    ...(process.argv.includes('--github-output') ? { githubOutput: process.env.GITHUB_OUTPUT } : {}),
    ...(branchIndex > 0 ? { branch: process.argv[branchIndex + 1] } : {})
  }).catch(error => {
    console.error(error instanceof Error ? error.stack ?? error.message : error)
    process.exitCode = 1
  })
}
