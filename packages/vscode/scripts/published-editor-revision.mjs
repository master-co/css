// The revision of the editor the stores serve. A release decides editor delivery
// against it rather than against the previous push, whose range drops the editor
// changes of a push whose release failed or planned none. publish-editors packages
// the tagged release revision with the npm version (editor-version.mjs), so a
// version every store serves on every target names its `v<version>` tag. Whatever
// is not proven (stores that disagree or cannot be read, an editor version without a
// release tag, a tag outside this history) yields no revision, and the caller then
// delivers the editor.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { compareVersions } from './editor-version.mjs'
import { TARGETS } from './package-target-core.js'
import { publicMarketplace } from './verify-store-availability.mjs'

const name = 'master-css-vscode'
const stable = /^\d+\.\d+\.\d+$/

function gitCommand(args) {
  try {
    return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  } catch {
    return null
  }
}

async function openVSX(fetchMetadata, path) {
  const response = await fetchMetadata(`https://open-vsx.org/api/master/${name}${path}`, {
    headers: { accept: 'application/json', 'cache-control': 'no-cache' }, redirect: 'error', signal: AbortSignal.timeout(15_000) })
  assert.ok(response.status === 200 || response.status === 404, `Open VSX lookup failed for ${path || 'the latest version'}: HTTP ${response.status}`)
  return response.status === 200 ? response.json() : null
}

/** `{ version, revision }` when the served editor's revision is proven, otherwise `{ reason }`. */
export async function publishedEditorRevision({ head, marketplace = publicMarketplace, fetchMetadata = fetch, git = gitCommand }) {
  assert.ok(head, 'The head revision is required')
  const metadata = await marketplace(`masterco.${name}`)
  const versions = (metadata?.versions ?? []).filter(item => stable.test(item?.version))
  if (!versions.length) return { reason: 'The Marketplace serves no stable editor version' }
  const version = versions.map(item => item.version).reduce((a, b) => compareVersions(a, b) >= 0 ? a : b)
  const missing = TARGETS.filter(target => !versions.some(item => item.version === version && item.targetPlatform === target))
  if (missing.length) return { reason: `Marketplace ${version} lacks ${missing.join(', ')}` }
  const latest = await openVSX(fetchMetadata, '')
  if (latest?.version !== version) return { reason: `Open VSX serves ${latest?.version ?? 'no version'} and the Marketplace ${version}` }
  const served = await Promise.all(TARGETS.map(target => openVSX(fetchMetadata, `/${target}/${version}`)))
  const absent = TARGETS.filter((target, index) => served[index]?.version !== version || served[index]?.targetPlatform !== target)
  if (absent.length) return { reason: `Open VSX ${version} lacks ${absent.join(', ')}` }
  const revision = git(['rev-parse', '--verify', '--quiet', `refs/tags/v${version}^{commit}`])
  if (!revision) return { reason: `Editor ${version} has no v${version} release tag` }
  if (git(['merge-base', '--is-ancestor', revision, head]) === null) return { reason: `v${version} is not in the history of ${head}` }
  return { version, revision }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const index = process.argv.indexOf('--head')
  const head = index >= 0 ? process.argv[index + 1] : undefined
  let result
  try {
    result = await publishedEditorRevision({ head })
  } catch (error) {
    result = { reason: error instanceof Error ? error.message : String(error) }
  }
  if (result.revision) {
    console.error(`::notice::The stores serve editor ${result.version}, built from ${result.revision}`)
    console.log(result.revision)
  } else {
    console.error(`::warning::No published editor revision to compare with, so the editor is delivered: ${result.reason}`)
  }
}
