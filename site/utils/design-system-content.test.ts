import '../scripts/bundler-imports'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'
import { designSystemContent, designSystemRoutes } from './design-system-content'
import { extractSearchNodesFromMdx } from '../docs-shell/utils/search-pages'
import { componentGroups, recipeGroups, materialRoles, canvasTreatments } from '../content/design-system/components/catalog'
import { projectStyleExample, projectTokenDefinitions } from '../components/demo/project-style-examples'
import { configuredMarkupMarkdown } from '../reference/configured-example'

const siteRoot = fileURLToPath(new URL('..', import.meta.url))

test('the curated overview exports the same source, tokens, materials and complete destinations', async () => {
  const content = await designSystemContent(siteRoot, '/design-system')
  assert.match(content.markdown, /<a id="workspace"><\/a>\n\n## A small document workspace/)
  const example = projectStyleExample('tokens')
  assert.ok(content.markdown.includes(configuredMarkupMarkdown(example.source, example.html)))
  for (const token of projectTokenDefinitions) {
    assert.ok(content.markdown.includes(token.name))
    assert.ok(content.markdown.includes(token.value))
  }
  for (const role of materialRoles) assert.ok(content.markdown.includes(role.token))
  for (const group of componentGroups) for (const entry of group.entries) {
    assert.ok(content.markdown.includes(`[${entry.title}](/design-system/review/${entry.slug})`))
  }
  assert.doesNotMatch(content.markdown, /<(?:Workbench|Materials|Controls|DocumentPatterns|ComponentCatalog)\b/)
})

test('every component and authoring document has complete portable content and matching search nodes', async () => {
  const searches = await Promise.all(['en', 'tw'].map(async locale => JSON.parse(await readFile(new URL(`../public/search/${locale}.json`, import.meta.url), 'utf8'))))
  for (const route of designSystemRoutes) {
    const content = await designSystemContent(siteRoot, route)
    assert.deepEqual(content.notes, [], route)
    assert.ok(content.markdown.length > 150, `${route}: a complete document`)
    for (const pages of searches) {
      const page = pages.find((page: { url: string }) => page.url.replace(/^\/(en|tw)(?=\/)/, '') === route)
      assert.ok(page, `${route}: search destination`)
      assert.deepEqual(page.nodes, extractSearchNodesFromMdx(content.searchMarkdown), `${route}: search equivalence`)
    }
  }
  const authoring = await designSystemContent(siteRoot, '/design-system/authoring')
  const canvas = await designSystemContent(siteRoot, '/design-system/review/demo')
  for (const choice of canvasTreatments) {
    assert.ok(canvas.markdown.includes(`| \`${choice.background}\` | ${choice.description} |`))
  }
  for (const group of recipeGroups) {
    assert.ok(authoring.markdown.includes(`/design-system/authoring#${group.id}`))
    assert.ok(authoring.markdown.includes(`<a id="${group.id}"></a>`))
    assert.ok(authoring.searchMarkdown.includes(`### ${group.title} {#${group.id}}`))
  }
  assert.match(authoring.markdown, /frame="none"/)
  assert.match(authoring.markdown, /padding="none"/)
  const parameters = await designSystemContent(siteRoot, '/design-system/review/parameters')
  assert.match(parameters.markdown, /range\.start\.character/)
  assert.match(parameters.markdown, /Required when parent is provided/)
  const stylesheet = await designSystemContent(siteRoot, '/design-system/review/stylesheet')
  assert.match(stylesheet.markdown, /--color-brand: #4f46e5/)
  assert.match(stylesheet.markdown, /bg-brand/)
  assert.match(stylesheet.markdown, /keyframes fade-in/)
})
