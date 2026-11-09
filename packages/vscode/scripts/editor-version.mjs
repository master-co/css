// The editor ships with the npm release it is part of and takes that release's
// version. `package.json`'s version is the floor: it stays in effect while npm is
// behind it (2.0.x after the editor reached 2.0.38) or releases a prerelease, which
// the stores cannot publish. Dependency-free so that every editor job can run it
// before installing the workspace.
import assert from 'node:assert/strict'
import { appendFile, readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const stable = /^(\d+)\.(\d+)\.(\d+)$/
const manifestPath = join(import.meta.dirname, '..', 'package.json')

export function compareVersions(a, b) {
  const [left, right] = [stable.exec(a), stable.exec(b)]
  assert.ok(left && right, `Expected stable versions: ${a}, ${b}`)
  for (let index = 1; index <= 3; index++) {
    const difference = Number(left[index]) - Number(right[index])
    if (difference) return Math.sign(difference)
  }
  return 0
}

/** The editor version for a release of `npmVersion` (empty when no npm release is planned). */
export function resolveEditorVersion(floor, npmVersion) {
  assert.match(floor, stable, 'The editor version floor must be a stable version')
  if (!npmVersion || !stable.test(npmVersion)) return floor
  return compareVersions(npmVersion, floor) > 0 ? npmVersion : floor
}

/** Sets the packaged version in the manifest text without reformatting it. */
export function stampManifest(text, version) {
  const manifest = JSON.parse(text)
  assert.match(version, stable, 'The editor version must be a stable version')
  assert.ok(compareVersions(version, manifest.version) >= 0, `Editor version ${version} is below the floor ${manifest.version}`)
  const stamped = text.replace(/^(\s*"version":\s*")[^"]*(")/m, `$1${version}$2`)
  assert.equal(JSON.parse(stamped).version, version, 'The manifest version could not be set')
  return stamped
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = process.argv.slice(2)
  const option = name => {
    const index = args.indexOf(name)
    return index < 0 ? undefined : args[index + 1] ?? ''
  }
  const text = await readFile(manifestPath, 'utf8')
  const stamp = option('--stamp')
  if (stamp !== undefined) {
    await writeFile(manifestPath, stampManifest(text, stamp))
    console.log(stamp)
  } else {
    const version = resolveEditorVersion(JSON.parse(text).version, option('--npm-version'))
    if (args.includes('--github-output')) await appendFile(process.env.GITHUB_OUTPUT, `version=${version}\n`)
    console.log(version)
  }
}
