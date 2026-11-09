import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { promisify } from 'node:util'
import { TARGETS, packageDir } from './package-target-core.js'

export async function publicMarketplace(extensionId) {
  const require = createRequire(join(packageDir, 'package.json'))
  const executable = join(dirname(require.resolve('@vscode/vsce/package.json')), 'vsce')
  const allowed = /^(?:PATH|PATHEXT|HOME|USERPROFILE|SYSTEMROOT|WINDIR|COMSPEC|TMPDIR|TMP|TEMP|SSL_CERT_FILE|SSL_CERT_DIR|NODE_EXTRA_CA_CERTS|HTTPS?_PROXY|NO_PROXY)$/i
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => allowed.test(key)))
  const { stdout } = await promisify(execFile)(process.execPath, [executable, 'show', extensionId, '--json'], {
    cwd: packageDir, env, timeout: 30_000, maxBuffer: 8 * 1024 * 1024
  })
  return JSON.parse(stdout)
}

/** Public metadata only. Absence is not a reservation or publication authorization. */
export async function verifyStoreAvailability(manifest, { marketplace = publicMarketplace, fetchMetadata = fetch } = {}) {
  assert.equal(manifest.name, '@master/css-vscode', 'Unexpected source package identity')
  assert.equal(manifest.publisher, 'masterco', 'Unexpected source Marketplace publisher')
  assert.match(manifest.version, /^\d+\.\d+\.\d+$/, 'The editor candidate must have a reviewed release version')
  // Use the same scoped-workspace to Marketplace identity as VSIX staging.
  const name = manifest.name.replace('@master/', 'master-')
  const marketplaceId = `${manifest.publisher}.${name}`
  const metadata = await marketplace(marketplaceId)
  assert.equal(metadata?.publisher?.publisherName, manifest.publisher, 'Marketplace publisher identity differs')
  assert.equal(metadata.extensionName, name, 'Marketplace extension identity differs')
  assert.ok(Array.isArray(metadata.versions) && metadata.versions.length > 0, 'Marketplace version inventory is missing')
  for (const item of metadata.versions) assert.equal(typeof item.version, 'string', 'Malformed Marketplace version inventory')
  const occupied = metadata.versions.filter(item => item.version === manifest.version)
    .map(item => `${marketplaceId}/${item.targetPlatform ?? 'universal'}`)
  const targets = [...TARGETS, 'universal']
  const results = await Promise.all(targets.map(async target => {
    const url = `https://open-vsx.org/api/master/${name}/${target}/${manifest.version}`
    const response = await fetchMetadata(url, { headers: { accept: 'application/json', 'cache-control': 'no-cache' },
      redirect: 'error', signal: AbortSignal.timeout(15_000) })
    assert.ok(response.status === 200 || response.status === 404, `Open VSX lookup failed for ${target}: HTTP ${response.status}`)
    const data = await response.json()
    if (response.status === 404) {
      assert.ok(typeof data?.error === 'string' && data.error.length > 0, `Open VSX absence response is malformed: ${target}`)
      return null
    }
    assert.equal(data.namespace, 'master', 'Open VSX namespace identity differs')
    assert.equal(data.name, name, 'Open VSX extension identity differs')
    assert.equal(data.version, manifest.version, 'Open VSX version identity differs')
    assert.equal(data.targetPlatform, target, 'Open VSX target identity differs')
    return `master.${name}/${target}`
  }))
  occupied.push(...results.filter(Boolean))
  assert.equal(occupied.length, 0, `Editor version ${manifest.version} already exists: ${occupied.join(', ')}. Review a new source version and repeat candidate validation; do not skip duplicates.`)
  return { version: manifest.version, marketplace: marketplaceId, openVSX: `master.${name}`,
    checkedTargets: targets, available: true, publicationPerformed: false }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const manifest = JSON.parse(await readFile(join(packageDir, 'package.json'), 'utf8'))
  // `--version` checks the version this release will package (editor-version.mjs).
  const index = process.argv.indexOf('--version')
  if (index >= 0) manifest.version = process.argv[index + 1]
  console.log(JSON.stringify(await verifyStoreAvailability(manifest), null, 2))
}
