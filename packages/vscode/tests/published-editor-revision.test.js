import { expect, test } from 'vitest'
import { TARGETS } from '../scripts/package-target-core.js'
import { publishedEditorRevision } from '../scripts/published-editor-revision.mjs'

const listing = (version, targets = TARGETS) => targets.map(targetPlatform => ({ version, targetPlatform }))
const marketplace = (...versions) => async id => {
  expect(id).toBe('masterco.master-css-vscode')
  return { versions: versions.flat() }
}
const json = (status, body) => ({ status, json: async () => body })
const openVSX = (version, { latest = version, absent = [] } = {}) => async (url, init) => {
  expect(init.redirect).toBe('error')
  expect(init.headers.authorization).toBeUndefined()
  const path = new URL(url).pathname
  if (path === '/api/master/master-css-vscode') return json(200, { version: latest })
  const [, target, requested] = /^\/api\/master\/master-css-vscode\/([^/]+)\/([^/]+)$/.exec(path)
  if (requested !== version || absent.includes(target)) return json(404, { error: 'Extension version not found' })
  return json(200, { version, targetPlatform: target })
}
const git = ({ tags = { 'v2.1.0': 'a'.repeat(40) }, ancestor = true } = {}) => args => {
  if (args[0] === 'rev-parse') return tags[/^refs\/tags\/(.+)\^\{commit\}$/.exec(args.at(-1))[1]] ?? null
  expect(args).toEqual(['merge-base', '--is-ancestor', 'a'.repeat(40), 'head'])
  return ancestor ? '' : null
}

test('the newest version every store serves on every target names its release revision', async () => {
  const result = await publishedEditorRevision({ head: 'head', git: git(),
    marketplace: marketplace(listing('2.0.9'), listing('2.1.0'), listing('2.0.37'), { version: '2.2.0-rc.1', targetPlatform: 'linux-x64' }),
    fetchMetadata: openVSX('2.1.0') })
  expect(result).toEqual({ version: '2.1.0', revision: 'a'.repeat(40) })
})

test('an editor version without a release tag is unproven', async () => {
  const result = await publishedEditorRevision({ head: 'head', git: git({ tags: {} }),
    marketplace: marketplace(listing('2.0.37')), fetchMetadata: openVSX('2.0.37') })
  expect(result.reason).toMatch('no v2.0.37 release tag')
})

test('a tag outside the released history is unproven', async () => {
  const result = await publishedEditorRevision({ head: 'head', git: git({ ancestor: false }),
    marketplace: marketplace(listing('2.1.0')), fetchMetadata: openVSX('2.1.0') })
  expect(result.reason).toMatch('not in the history of head')
})

test('a partial publication on either store is unproven', async () => {
  const partial = await publishedEditorRevision({ head: 'head', git: git(),
    marketplace: marketplace(listing('2.0.37'), listing('2.1.0', TARGETS.slice(1))), fetchMetadata: openVSX('2.1.0') })
  expect(partial.reason).toBe(`Marketplace 2.1.0 lacks ${TARGETS[0]}`)
  const open = await publishedEditorRevision({ head: 'head', git: git(),
    marketplace: marketplace(listing('2.1.0')), fetchMetadata: openVSX('2.1.0', { absent: ['alpine-arm64'] }) })
  expect(open.reason).toBe('Open VSX 2.1.0 lacks alpine-arm64')
})

test('stores serving different versions are unproven', async () => {
  const result = await publishedEditorRevision({ head: 'head', git: git(),
    marketplace: marketplace(listing('2.1.0')), fetchMetadata: openVSX('2.1.0', { latest: '2.0.37' }) })
  expect(result.reason).toBe('Open VSX serves 2.0.37 and the Marketplace 2.1.0')
})

test('an unreadable store fails instead of passing for a served revision', async () => {
  await expect(publishedEditorRevision({ head: 'head', git: git(), marketplace: marketplace(listing('2.1.0')),
    fetchMetadata: async () => json(503, {}) })).rejects.toThrow('HTTP 503')
  expect((await publishedEditorRevision({ head: 'head', git: git(), marketplace: marketplace(),
    fetchMetadata: openVSX('2.1.0') })).reason).toBe('The Marketplace serves no stable editor version')
})
