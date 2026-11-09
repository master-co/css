import assert from 'node:assert/strict'
import { test, before } from 'node:test'
import { readFile, readdir, mkdtemp, writeFile, rm, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createDocumentationSearch } from '@master/internal-site/utils/documentation-search'
import { extractSearchNodesFromMdx, extractSearchNodesFromMarkdown } from '@master/internal-site/utils/search-pages'
import { generateReference, renderDocumentMarkdown, localizeReferenceMarkdown } from './build'
import { searchTasks } from './search-tasks'
import { referenceText } from './copy'
import type { ReferenceCatalog } from './types'
import { generatePresetCSS } from '@master/internal-site/css/generate-preset-css.ts'
import { resolveSyntaxRow } from './syntax'
import resolveHeading from '@master/internal-site/utils/resolve-heading'
import { extractReferenceMdx } from './markdown'
import { configuredExampleCSS, configuredExampleHTML, configuredMarkupClasses } from '@master/internal-site/css/configured-example.ts'
import legacyAnchors from './legacy-anchors.json' with { type: 'json' }
import { collectCSSVariableReferences } from '../scripts/css-variable-references'
import { flattenMasterCSSManifestVariables } from '@master/css-schema/manifest'
import preset from '@master/internal-site/css/preset-manifest.ts'
import { compileManifestFileSync } from '@master/css-compiler/node'
import { syntaxTutorialContent } from '../utils/syntax-tutorial'
import { markdownTree } from '@master/internal-site/utils/markdown-tree'
import { documentHeadings } from './headings'
import { ungroupedFamilies } from './sheets'
import { documentationHygieneIssues } from '../tests/document-hygiene'
import { createReferenceRenderDocument, referenceRenderVersion } from './render-document'
import { referenceCodeProps, isStylesheetExample } from './code-block'
import highlightCode from '../adapters/highlight.ts'
import { prepareCode } from '@master/internal-site/utils/prepared-code'
import { variableNamespaceSources, variableNamespaceSourcesMarkdown } from '@master/internal-site/css/variable-namespace-sources.ts'

const root = fileURLToPath(new URL('../', import.meta.url))

/** Ids a reader can land on: headings, explicit anchors and the rows of a structured sheet. */
function documentAnchors(doc: ReferenceCatalog['documents'][number]) {
  const ids = new Set([...doc.headings.map(heading => heading.id), ...[...doc.markdown.matchAll(/<a id="([^"]+)"><\/a>/g)].map(match => match[1])])
  const sheet = doc.sheet
  if (sheet?.kind === 'tokens') for (const group of sheet.groups) for (const value of group.values) ids.add(value.id)
  if (sheet?.kind === 'families') for (const group of sheet.groups) for (const row of group.rows) ids.add(`family-${row.prefix}`)
  if (sheet?.kind === 'families') for (const family of ungroupedFamilies(sheet)) ids.add(`family-${family.prefix}`)
  if (sheet?.kind === 'named-conditions') for (const group of sheet.groups) for (const row of group.rows) ids.add(row.id)
  return ids
}
let catalog: ReferenceCatalog
before(async () => {
  const pages = JSON.parse(await readFile(path.join(root, '.pages.json'), 'utf8'))
  catalog = await generateReference(root, undefined, [...pages, { pathname: '/reference/tools/cli/migrate' }])
})

test('Reference and shared search styles use defined site theme variables', async () => {
  const { manifest } = compileManifestFileSync(fileURLToPath(import.meta.resolve('@master/internal-site/styles/docs-shell/theme.css')), { baseManifest: preset })
  const names = new Set(flattenMasterCSSManifestVariables(manifest.variables).map(variable => variable.name))
  // Interface roles come from the site design system, not the theme manifest.
  for (const [, name] of (await readFile(fileURLToPath(import.meta.resolve('@master/internal-site/styles/system/tokens.css')), 'utf8')).matchAll(/(?:^|[\s;{])--(ui-[\w-]+)\s*:/g)) names.add(name)
  for (const file of [path.join(root, 'styles/reference.css'), fileURLToPath(import.meta.resolve('@master/internal-site/styles/documentation-index.css')), fileURLToPath(import.meta.resolve('@master/internal-site/styles/docs-shell/documentation-search.css'))]) {
    const css = await readFile(file, 'utf8')
    for (const name of collectCSSVariableReferences(css)) assert.ok(names.has(name), `${file}: --${name}`)
  }
})

test('catalog covers every public family and preset recipe without indexing retired pages', async () => {
  const { foundationFamilies } = await import('@master/internal-site/css/foundation-data/tokens.ts')
  const { recipePages } = await import('./sheet-editorial')
  assert.equal(catalog.documents.length, 32)
  assert.equal(catalog.documents.filter(doc => doc.kind === 'utility').length, recipePages.length)
  // Fixed utilities emit one declaration; the declarations contract lists them all.
  const fixed = preset.utilities!.filter(utility => utility.kind === 'static' && utility.body.length === 1 && utility.body[0].type === 'declaration')
  assert.equal(fixed.length, 292)
  const declarations = catalog.documents.find(doc => doc.id === 'rules/declarations')!
  for (const { name } of fixed) assert.ok(declarations.markdown.includes(`\`${name}\``), name)
  for (const page of recipePages) {
    const doc = catalog.documents.find(doc => doc.id === page.id)!
    for (const name of page.names) assert.match(doc.markdown, new RegExp(`\\| \`${name.replace(/[()]/g, '\\$&')}(?:\\(|\`)`), `${page.id}: ${name}`)
  }
  // The text recipe reads its own tokens, so the Text token page owns it.
  assert.deepEqual([...recipePages.flatMap(page => page.names), 'text'].sort(), preset.utilities!.filter(mixin => !fixed.includes(mixin) && !(mixin.kind === 'token' && foundationFamilies.some(family => family.argument === 'value' && family.utility === mixin.name))).map(mixin => mixin.name).sort())
  const families = catalog.documents.find(doc => doc.id === 'tokens/families')!
  assert.equal(new Set(families.headings.map(heading => heading.id)).size, families.headings.length)
  assert.ok(families.markdown.includes('[Font](/reference/tokens/font)'))
  const familyRows = families.sheet?.kind === 'families' ? [...families.sheet.groups.flatMap(group => group.rows), ...ungroupedFamilies(families.sheet)] : []
  assert.deepEqual(familyRows.map(row => `${row.prefix}:${row.namespace}:${row.property}`).sort(), foundationFamilies.map(row => `${row.prefix}:${row.namespace}:${row.property}`).sort())
  for (const family of foundationFamilies) {
    assert.ok(families.markdown.includes(`\`${family.prefix}-\` | \`--${family.namespace}-*\` | \`${family.property}\` |`), family.prefix)
    assert.equal(families.identifierAnchors?.[family.prefix], `family-${family.prefix}`)
    assert.ok(documentAnchors(families).has(`family-${family.prefix}`))
  }
  for (const slug of ['animate', 'display', 'padding', 'opacity', 'tokens/containers', 'tokens/content', 'tokens/font-feature', 'tokens/order', 'font-smooth', 'text-gradient', 'text-size', 'tokens/animate', 'tokens/color-text', 'tokens/font-size', 'clamp-lines', 'grid-columns', 'directives/entry']) assert.ok(!catalog.documents.some(doc => doc.id === slug), slug)
  assert.equal(new Set(catalog.documents.map(doc => doc.id)).size, catalog.documents.length)
  for (const doc of catalog.documents) {
    assert.deepEqual(doc.extractionNotes, [], doc.id)
    for (const id of doc.related) assert.ok(catalog.documents.some(doc => doc.id === id), `${doc.id} → ${id}`)
    const anchors = documentAnchors(doc)
    for (const [identifier, anchor] of Object.entries(doc.identifierAnchors ?? {})) assert.ok(anchors.has(anchor), `${doc.id}: ${identifier} → ${anchor}`)
  }
})

test('motion lookup owns the animation shorthand family and all ten preset values', () => {
  const animation = catalog.documents.find(doc => doc.id === 'tokens/motion')!
  assert.match(animation.markdown, /animation: var\(--animate-<animation>\)/)
  assert.match(animation.markdown, /family-animate/)
  assert.match(animation.markdown, /transition-duration:var\(--duration-fast\)/)
  assert.doesNotMatch(animation.markdown, /companion|reference\/animate|@apply --animate/)
  for (const name of ['fade', 'flash', 'float', 'heart', 'jump', 'pulse', 'ping', 'rotate', 'shake', 'zoom']) {
    assert.ok(animation.identifierAnchors?.[`--animate-${name}`], name)
  }
})

test('acceptance queries find localized Reference editions in the first three results', async () => {
  for (const locale of ['en', 'tw', 'ja', 'ko', 'cn']) {
    const pages = JSON.parse(await readFile(path.join(root, `public/search/${locale}.json`), 'utf8'))
    const search = createDocumentationSearch(pages)
    const tasks = searchTasks.map(([query, id]) => {
      if (locale !== 'en' && ['Conditions', 'Variables and modes', 'Cascade layers', 'Publish the complete asset set'].includes(query)) {
        return [referenceText(id, 'title', locale), id] as const
      }
      return [query, id] as const
    })
    const failures = tasks.filter(([query, id]) => !search(query, 3).some(result => result.page.url.endsWith(`/reference/${id}`)))
    assert.ok(failures.length <= 3, `${locale}: ${JSON.stringify(failures)}`)
    for (const query of ['padding', 'p', 'px', 'padding-inline']) {
      const result = search(query, 1)[0]
      assert.equal(result.page.title, referenceText('tokens/families', 'title', locale), query)
      assert.match(result.href, /#family-/, query)
    }
    assert.match(search('@master/css#createEngine', 1)[0].href, /\/reference\/packages#css$/)
    for (const page of pages.filter((page: any) => page.identifiers)) {
      for (const identifier of page.identifiers) assert.ok(search(identifier.text, 1).length, `${identifier.text} has no results`)
    }
  }
})

test('current Reference excludes upgrade workflows and obsolete syntax identifiers', async () => {
  assert.ok(!catalog.documents.some(doc => doc.id === 'tools/cli/migrate'))
  const pages = JSON.parse(await readFile(path.join(root, '.pages.json'), 'utf8')) as { pathname: string }[]
  assert.ok(!pages.some(page => page.pathname === '/reference/tools/cli/migrate'))
  for (const doc of catalog.documents) {
    assert.deepEqual(documentationHygieneIssues(doc.markdown), [], doc.id)
  }
})

test('namespace consumer tables cover the registry including color role groups', async () => {
  const { namespaceFamilies, foundationFamilies } = await import('@master/internal-site/css/foundation-data/tokens.ts')
  const { tokenPages } = await import('./sheet-editorial')
  for (const namespace of [...new Set(foundationFamilies.flatMap(family => family.namespaces)), 'color-line', 'color-surface', 'color-text']) {
    const page = tokenPages.find(page => page.groups.some(group => group.namespace === namespace))
    assert.ok(page, namespace)
    const doc = catalog.documents.find(doc => doc.id === `tokens/${page.id}`)!
    for (const family of namespaceFamilies(namespace)) {
      assert.ok(doc.markdown.includes(`/reference/tokens/families#family-${family.prefix}`))
      assert.ok(doc.markdown.includes(`\`${family.property}\``))
    }
  }
  const container = catalog.documents.find(doc => doc.id === 'tokens/container')!
  assert.match(container.markdown, /Changing `--container-md` does not redefine `@container\(--md\)`/)
  const breakpoints = catalog.documents.find(doc => doc.id === 'rules/named-conditions')!
  for (const name of Object.keys(preset.customMedia!)) assert.ok(breakpoints.aliases.includes(`@${name.slice(2)}`))
  for (const name of Object.keys(preset.customContainers!)) assert.ok(breakpoints.aliases.includes(`@container(${name})`))
})

test('named conditions separate media and container registries and retire the token route', async () => {
  const { referenceIllustrations } = await import('./illustrations')
  const doc = catalog.documents.find(doc => doc.id === 'rules/named-conditions')!
  assert.equal(doc.kind, 'rule')
  assert.ok(!catalog.documents.some(doc => doc.id === 'tokens/breakpoints'))
  assert.equal(doc.sheet?.kind, 'named-conditions')
  if (doc.sheet?.kind !== 'named-conditions') throw new Error('Missing named-condition sheet')
  const rows = doc.sheet.groups.flatMap(group => group.rows)
  assert.equal(rows.length, Object.keys(preset.customMedia!).length + Object.keys(preset.customContainers!).length)
  assert.equal(new Set(rows.map(row => row.id)).size, rows.length)
  const portable = renderDocumentMarkdown(doc, catalog)
  for (const row of rows) {
    assert.ok(doc.identifierAnchors?.[row.suffix] === row.id)
    assert.ok(portable.includes(`<a id="${row.id}"></a>`))
    assert.ok(generatePresetCSS([`block${row.suffix}`]).includes(row.query), row.suffix)
  }
  const figure = referenceIllustrations['condition-domains']
  assert.equal(rows.find(row => row.suffix === '@md')?.query, `(width >= ${figure.viewportRem}rem)`)
  assert.equal(rows.find(row => row.suffix === '@container(--md)')?.query, `(width >= ${figure.containerRem}rem)`)
})

test('all generated token and recipe examples reproduce complete CSS', () => {
  for (const doc of catalog.documents.filter(doc => ['utility', 'tokens'].includes(doc.kind) || doc.id === 'rules/named-conditions')) {
    for (const example of doc.examples) {
      assert.equal(example.css, example.configuration ? configuredExampleCSS(example.configuration, example.classes) : generatePresetCSS(example.classes), `${doc.id}: ${example.title}`)
      assert.ok(example.css.length > 0)
      assert.ok(doc.markdown.includes(example.css))
    }
  }
  const conditions = catalog.documents.find(doc => doc.id === 'rules/conditions')!
  assert.match(conditions.examples[0].css, /@layer utilities/)
})

test('explicit anchors survive renamed headings and are exported as portable Markdown anchors', () => {
  assert.equal(resolveHeading('New heading {#old-heading}', 'new-heading').id, 'old-heading')
  assert.equal(resolveHeading('Overview [sr-only] {#overview}', 'unused').className, 'sr-only')
  for (const doc of catalog.documents.filter(doc => doc.kind === 'utility')) {
    const markdown = renderDocumentMarkdown(doc, catalog)
    assert.doesNotMatch(markdown, /^#{2,3} .*\{#[\w-]+\}$/m)
    assert.equal(new Set(doc.headings.map(heading => heading.id)).size, doc.headings.length, doc.id)
  }
})

test('mode and layer contracts retain complete configured CSS, consumers and unique stable anchors', () => {
  for (const id of ['rules/modes', 'rules/layers']) {
    const doc = catalog.documents.find(doc => doc.id === id)!
    assert.equal(new Set(doc.headings.map(heading => heading.id)).size, doc.headings.length, id)
    const configured = doc.examples.filter(example => example.configuration !== undefined)
    assert.equal(configured.length, id === 'rules/layers' ? 6 : 5, id)
    for (const example of configured) {
      assert.equal(example.css, configuredExampleCSS(example.configuration!, example.classes))
      assert.ok(doc.markdown.includes(example.css))
      assert.match(example.css, /@layer (?:base|defaults|utilities|components)/)
    }
  }
  const modes = catalog.documents.find(doc => doc.id === 'rules/modes')!
  assert.ok(modes.markdown.includes('/reference/tokens/families'))
  // Consumers come from the utility registry: fixed order values register no namespace.
  assert.equal(variableNamespaceSources.find(row => row.namespace === 'order'), undefined)
  assert.ok(variableNamespaceSources.find(row => row.namespace === 'spacing')?.consumers.includes('col-gap-'))
  assert.ok(variableNamespaceSources.find(row => row.namespace === 'spacing')?.consumers.includes('scroll-pxe-'))
  assert.ok(!variableNamespaceSources.find(row => row.namespace === 'container')?.consumers.some(key => key.startsWith('@')))
  const layers = catalog.documents.find(doc => doc.id === 'rules/layers')!
  assert.ok(layers.headings.some(heading => heading.id === 'summary' && heading.title === 'Defaults stay below local decisions'))
  assert.ok(layers.headings.some(heading => heading.id === 'layer-checklist'))
  assert.match(layers.markdown, /!important` reverses the order between layers/)
  const base = layers.examples.find(example => example.classes.includes('(list-style:none)_ul@layer(base)'))!
  assert.match(base.css, /@layer base\{.*list-style:none/)
  const fonts = layers.examples.find(example => example.classes.includes('font-mono_:is(code,pre)@layer(defaults)'))!
  assert.match(fonts.css, /--font-family-mono:/)
  assert.match(fonts.css, /font-family:var\(--font-family-mono\)/)
  assert.deepEqual(configuredMarkupClasses('<ul class="(list-style:none) p-card"><li class="p-card">One</li></ul>'), ['(list-style:none)', 'p-card'])
  assert.throws(() => configuredExampleCSS('', ['(list-style:10px)']), /Invalid configured documentation class/)
})

test('token pages list every preset value once, with its variable and a resolving anchor', async () => {
  const { tokenPages } = await import('./sheet-editorial')
  const variables = flattenMasterCSSManifestVariables(preset.variables)
  const listed = new Set<string>()
  for (const page of tokenPages) {
    const doc = catalog.documents.find(doc => doc.id === `tokens/${page.id}`)!
    const markdown = renderDocumentMarkdown(doc, catalog)
    const anchors = documentAnchors(doc)
    for (const prerequisite of page.usage.keep ?? []) {
      assert.ok(doc.examples.find(example => example.id === 'usage')?.classes.includes(prerequisite), `${page.id}: ${prerequisite}`)
      assert.ok(markdown.includes(prerequisite), `${page.id}: exported prerequisite ${prerequisite}`)
    }
    for (const variable of variables.filter(variable => page.groups.some(group => group.namespace === variable.namespace))) {
      assert.ok(!listed.has(variable.name), variable.name)
      listed.add(variable.name)
      // Every preset token has one :root,:host value; a scoped token would need its own column.
      assert.deepEqual(variable.values.map(value => value.path.join(' → ')), [':root,:host'], variable.name)
      const value = variable.values[0].value.replaceAll('|', '\\|')
      assert.ok(markdown.includes(`\`--${variable.name}\``) || variable.key.includes('--'), `${doc.id}: --${variable.name}`)
      assert.ok(markdown.includes(`\`${value}\``), `${doc.id}: ${variable.name} = ${value}`)
      assert.ok(anchors.has(doc.identifierAnchors?.[`--${variable.name}`] ?? ''), `${doc.id}: --${variable.name}`)
    }
  }
  assert.deepEqual([...listed].sort(), variables.map(variable => variable.name).sort())
})

test('language contracts export portable examples, complete CSS and stable section anchors', () => {
  for (const id of ['rules/declarations', 'rules/selectors', 'rules/conditions', 'rules/extraction']) {
    const doc = catalog.documents.find(doc => doc.id === id)!
    const markdown = renderDocumentMarkdown(doc, catalog)
    const anchors = new Set([...documentHeadings(markdown).map(heading => heading.id), ...[...markdown.matchAll(/<a id="([^"]+)"><\/a>/g)].map(match => match[1])])
    for (const heading of doc.headings) assert.ok(anchors.has(heading.id), `${id}#${heading.id}`)
    assert.doesNotMatch(markdown, /MCSS_EXPRESSION|<(?:Demo|Class2CSS|ConfiguredExample)\b/)
    // JSX syntax can be discussed literally; exported HTML examples must still be HTML.
    for (const fence of markdown.matchAll(/```html[^\n]*\n([\s\S]*?)\n```/g)) assert.doesNotMatch(fence[1], /\bclassName=/)
    for (const example of doc.examples) {
      const css = example.configuration === undefined
        ? generatePresetCSS(example.classes)
        : configuredExampleCSS(example.configuration, example.classes)
      assert.equal(example.css, css, `${id}: ${example.title}`)
      assert.ok(markdown.includes(css))
    }
  }
  const extraction = renderDocumentMarkdown(catalog.documents.find(doc => doc.id === 'rules/extraction')!, catalog)
  assert.match(extraction, /font-size:var\(--headline-size\)/)
  assert.match(extraction, /width:var\(--progress\)/)
  assert.match(extraction, /setProperty\('--progress'/)
  assert.doesNotMatch(extraction, /(?:font-size|w):\$/)
  const conditions = renderDocumentMarkdown(catalog.documents.find(doc => doc.id === 'rules/conditions')!, catalog)
  assert.match(conditions, /\(container-name:card\) container-inline/)
  assert.match(conditions, /@supports\(display:grid\)/)
  assert.doesNotMatch(conditions, /`css @/)
})

test('Reference illustrations retain their explanation in portable content and search', async () => {
  const { referenceIllustrations, referenceIllustrationMarkdown } = await import('./illustrations')
  const tokenFigures = catalog.documents.flatMap(doc => doc.sheet?.kind === 'tokens' && doc.sheet.explanation ? [[doc.id, doc.sheet.explanation.illustration] as const] : [])
  const authoredFigures = catalog.documents.flatMap(doc => [...doc.markdown.matchAll(/<!-- reference-illustration:([\w-]+) -->/g)].map(match => [doc.id, match[1] as keyof typeof referenceIllustrations] as const))
  for (const [documentId, figureId] of [...tokenFigures, ...authoredFigures, ...[['rules/declarations', 'native-value-boundary'], ['rules/selectors', 'selector-targets'], ['rules/conditions', 'nested-conditions'], ['rules/modes', 'inline-resolution'], ['rules/layers', 'layer-precedence'], ['rules/extraction', 'shared-source-class'], ['rules/named-conditions', 'condition-domains'], ['tokens/families', 'namespace-lookup']] as const]) {
    const doc = catalog.documents.find(doc => doc.id === documentId)!
    const figure = referenceIllustrations[figureId]
    const portable = renderDocumentMarkdown(doc, catalog)
    assert.deepEqual(doc.extractionNotes, [])
    assert.ok(doc.markdown.includes(referenceIllustrationMarkdown(figureId)))
    const tree = markdownTree(doc.markdown)
    const markers = tree.children.filter(node => node.type === 'html' && node.value.includes('reference-illustration'))
    const starts = markers.filter(node => node.type === 'html' && node.value.startsWith('<!-- reference-illustration:'))
    assert.equal(markers.length, starts.length * 2)
    for (let index = 0; index < markers.length; index += 2) {
      assert.match((markers[index] as { value: string }).value, /^<!-- reference-illustration:[\w-]+ -->$/)
      assert.equal((markers[index + 1] as { value: string }).value, '<!-- /reference-illustration -->')
    }
    assert.ok(portable.includes(figure.caption))
    for (const text of figure.description) assert.ok(portable.includes(text))
    assert.doesNotMatch(portable, /reference-illustration|<ReferenceIllustration/)
    const searchText = extractSearchNodesFromMarkdown(doc.markdown).map(node => node.text).join(' ')
    assert.ok(searchText.includes(figure.title))
  }
  assert.throws(() => referenceIllustrationMarkdown('missing'), /Unknown Reference illustration/)
  const declarations = catalog.documents.find(doc => doc.id === 'rules/declarations')!
  assert.ok(declarations.examples.some(example => example.classes.includes("(content:')')::before") && example.css.includes("content:')'")))
})

test('continuing recipe and Guide anchors remain available', async () => {
  const missing: string[] = []
  for (const page of legacyAnchors.pages) {
    const retired = page.source.match(/\/reference\/([^/]+)\/content.mdx$/)?.[1]
    if (retired && !catalog.documents.some(doc => doc.id === retired)) continue
    const generated = catalog.documents.find(doc => page.source === `site/content/reference/${doc.id}/content.mdx`)
    if (generated) {
      for (const id of page.anchors) if (!generated.markdown.includes(`id="${id}"`) && !generated.headings.some(h => h.id === id)) missing.push(`${page.source}#${id}`)
      continue
    }
    // Guide pages retired without redirects no longer carry their old anchors.
    const source = await readFile(path.join(root, '..', page.source), 'utf8').catch(() => undefined)
    if (source === undefined) continue
    const ids = new Set(extractSearchNodesFromMdx(source).filter(node => node.id).map(node => node.id))
    for (const match of source.matchAll(/<a id="([^"]+)"/g)) ids.add(match[1])
    for (const id of page.anchors) if (!ids.has(id)) missing.push(`${page.source}#${id}`)
  }
  assert.deepEqual(missing, [])
})

test('Reference links and preserved Guide anchors resolve to real documents and sections', async () => {
  const guideRoutes = new Set((await readdir(path.join(root, 'content/guide'), { recursive: true }))
    .filter(file => file.endsWith('page.astro') || file.endsWith('content.mdx'))
    .map(file => '/guide/' + file.replace(/\([^/]+\)\//g, '').replace(/\/(?:page\.astro|content\.mdx)$/, '')))
  for (const doc of catalog.documents) {
    for (const match of doc.markdown.matchAll(/\]\((\/guide\/[^)#]+)(?:#[^)]+)?\)/g)) {
      assert.ok(guideRoutes.has(match[1]), `${doc.id}: ${match[1]}`)
    }
    for (const match of doc.markdown.matchAll(/\]\((\/reference\/[^\s)]+)\)/g)) {
      const [url, anchor] = match[1].split('#')
      const target = catalog.documents.find(doc => doc.url === url.replace(/\.md$/, ''))
      assert.ok(target, `${doc.id}: ${match[1]}`)
      if (anchor) assert.ok(documentAnchors(target).has(anchor) || target.rows.some(row => row.id === anchor), `${doc.id}: ${match[1]}`)
    }
  }
  for (const doc of catalog.documents.filter(doc => doc.kind === 'rule')) {
    const [guideURL, guideAnchor] = doc.guide!.split('#')
    const guide = await readFile(path.join(root, `content${guideURL}/content.mdx`), 'utf8')
    if (guideAnchor) {
      assert.ok(extractSearchNodesFromMdx(guide).some(node => node.id === guideAnchor), doc.guide)
      continue
    }
    const source = await readFile(path.join(root, '..', doc.source), 'utf8')
    for (const heading of extractSearchNodesFromMdx(source).filter(node => node.id)) assert.ok(guide.includes(`id="${heading.id}"`), `${doc.guide}#${heading.id}`)
  }
})

test('Syntax tutorial preserves its learning path, executable examples and searchable output', async () => {
  const tutorial = await syntaxTutorialContent(root)
  assert.deepEqual(tutorial.notes, [])
  assert.deepEqual(documentationHygieneIssues(tutorial.markdown), [])
  assert.doesNotMatch(tutorial.markdown, /<ButtonPreview|MCSS_EXPRESSION|\{#|\/guide\/migration/)
  for (const anchor of ['declarations', 'values', 'token-families', 'composition', 'cascade', 'states', 'conditions', 'complete-card']) {
    assert.ok(tutorial.markdown.includes(`id="${anchor}"`), anchor)
  }
  for (const example of tutorial.examples) {
    assert.equal(example.css, configuredExampleCSS(example.configuration ?? '', example.classes), example.title)
    assert.ok(tutorial.markdown.includes(example.css), example.title)
  }
  const { foundationFamilies } = await import('@master/internal-site/css/foundation-data/tokens.ts')
  for (const [prefix, key] of [['p', 'md'], ['gap', 'md'], ['fg', 'text-muted']]) {
    const family = foundationFamilies.find(family => family.prefix === prefix)!
    assert.ok(tutorial.markdown.includes(`| \`${prefix}-${key}\` | \`${family.property}: var(--${family.namespaces[0]}-${key})\` |`), prefix)
  }
  for (const match of tutorial.markdown.matchAll(/\]\((\/reference\/[^)#]+)(?:#([^)]*))?\)/g)) {
    const doc = catalog.documents.find(doc => doc.url === match[1])
    assert.ok(doc, match[1])
    if (match[2]) assert.ok(doc.headings.some(heading => heading.id === match[2]), match[0])
  }
  const nodes = markdownTree(tutorial.markdown).children
  const generated = nodes.filter(node => node.type === 'code').filter(node => node.meta?.includes('disclosure=generated-css'))
  // Every displayed example retains its actual generated output in the portable article.
  assert.equal(generated.length, tutorial.examples.length)
  const used = (className: string) => tutorial.examples.find(example => example.classes.includes(className))!
  const conditionalColor = used('fg-blue-60:hover@sm').css
  assert.match(conditionalColor, /@media/)
  assert.match(conditionalColor, /:hover\{color:var\(--color-blue-60\)/)
  assert.match(used('(max-width:32rem)').css, /max-width:32rem/)
  assert.match(used("(content:'New_collection')::before").css, /content:'New_collection'/)
  assert.match(used('(color:rgb(30_60_90/80%))').css, /color:rgb\(30 60 90\/80%\)/)
  assert.match(used('grid@sm@supports(display:grid)').css, /@media[^{}]+\{@supports \(display:grid\)/)
  const container = used('(grid-template-columns:1fr_auto)@container(card_width>=28rem)').css
  assert.match(container, /container-name:card/)
  assert.match(container, /container-type:inline-size/)
  assert.match(container, /@container card/)
  assert.match(container, /grid-template-columns:1fr auto/)
  const priority = configuredExampleCSS('', ['p-md', 'p(12)'])
  assert.ok(priority.includes('padding:var(--spacing-md)'))
  assert.ok(priority.includes('padding:calc(12 * 1px)'))
  assert.ok(priority.indexOf('padding:var(--spacing-md)') < priority.indexOf('padding:calc(12 * 1px)'))
  assert.equal(priority, configuredExampleCSS('', ['p(12)', 'p-md']))
  // The new figure remains meaningful when images and JSX are unavailable.
  assert.match(tutorial.markdown, /fg-blue-60 sets color to var\(--color-blue-60\)/)
  assert.match(tutorial.markdown, /selector and condition must both match/)
  assert.doesNotMatch(tutorial.markdown, /<SyntaxIllustration/)
  for (const locale of ['en', 'tw', 'ja', 'ko', 'cn']) {
    const searchPages = JSON.parse(await readFile(path.join(root, `public/search/${locale}.json`), 'utf8'))
    const canonical = (url: string) => url.replace(/^\/(en|tw|ja|ko|cn)(?=\/)/, '')
    const page = searchPages.find((page: any) => canonical(page.url) === '/guide/syntax-tutorial')
    const localizedTutorial = await syntaxTutorialContent(root, locale)
    assert.deepEqual(page.nodes, extractSearchNodesFromMarkdown(localizedTutorial.markdown))
    for (const id of ['declarations', 'composition', 'states', 'conditions', 'complete-card']) {
      assert.ok(page.nodes.some((node: { id?: string }) => node.id === id), `${locale}: ${id}`)
    }
  }
})

test('generated output metadata preserves source/result pairing and prepared highlights', async () => {
  for (const doc of catalog.documents) {
    const nodes = markdownTree(doc.markdown).children
    for (const example of doc.examples) {
      // Directive documents inherit examples outside their extracted section.
      if (!doc.markdown.includes(example.css)) continue
      assert.ok(nodes.some(node => node.type === 'code' && node.value === example.css && node.meta?.includes('disclosure=generated-css')), `${doc.id}: ${example.title}`)
    }
    for (let index = 0; index < nodes.length; index++) {
      const node = nodes[index]
      if (node.type !== 'code' || !node.meta?.includes('stylesheet=result')) continue
      assert.ok(isStylesheetExample(nodes[index - 2], nodes[index - 1], node), doc.id)
      assert.ok(node.meta.includes('disclosure=generated-css'), doc.id)
    }
  }
  const tutorial = await syntaxTutorialContent(root)
  const document = { ...catalog.documents[0], kind: 'rule' as const, markdown: tutorial.markdown }
  const payload = await createReferenceRenderDocument(document, 'generated-css-test')
  for (let index = 0; index < payload.tree.children.length; index++) {
    const node = payload.tree.children[index]
    if (node.type !== 'code' || !node.meta?.includes('disclosure=generated-css')) continue
    const paired = isStylesheetExample(payload.tree.children[index - 2], payload.tree.children[index - 1], node)
    const props = referenceCodeProps(node, paired)
    assert.deepEqual((node.data as any).prepared, await prepareCode(await highlightCode(node.value, { lang: props.lang, beautify: !!props.beautify, dedent: props.dedent })))
  }
})

test('machine indexes and prepared editions identify their own content and source revision', async () => {
  const editions = JSON.parse(await readFile(path.join(root, '.generated/reference-route-indexes.json'), 'utf8'))
  for (const locale of Object.keys(editions)) {
    const prefix = locale === 'en' ? '' : `${locale}/`
    const index = JSON.parse(await readFile(path.join(root, `public/${prefix}reference/index.json`), 'utf8'))
    assert.equal(index.revision, catalog.revision)
    assert.equal(index.locale, locale)
    for (const id of ['tokens/families', 'tokens/spacing', 'rules/conditions']) {
      const markdown = await readFile(path.join(root, `public/${prefix}reference/${id}.md`), 'utf8')
      const document = index.documents.find((doc: any) => doc.id === id)
      assert.ok(markdown.includes(catalog.version))
      assert.doesNotMatch(markdown, /English fallback/)
      assert.equal(markdown.match(/Content digest: (.+)/)?.[1], document.contentDigest)
      assert.equal(markdown.match(/Canonical: (.+)/)?.[1], document.url)
      assert.ok(markdown.includes(`Language: ${document.language}`))
    }
  }
})

test('route payloads preserve Reference content and its parsed render tree', async () => {
  const routeIndex = JSON.parse(await readFile(path.join(root, '.generated/reference-route-index.json'), 'utf8'))
  assert.deepEqual(routeIndex, catalog.documents.map(({ id, kind, title, description, category, url }) => ({ id, kind, title, description, category, url })))
  for (const doc of catalog.documents) {
    const { tree, renderDigest, ...document } = JSON.parse(await readFile(path.join(root, '.generated/reference-documents', 'en', `${encodeURIComponent(doc.id)}.json`), 'utf8'))
    assert.deepEqual(document, JSON.parse(JSON.stringify(doc)))
    assert.match(renderDigest, /^[a-f0-9]{64}$/)
    function withoutHighlights(node: any): any {
      if (node.type === 'code') {
        assert.match(node.data.prepared.html, /^<pre\b[^>]*\bmaster-site\b/, `${doc.id}: ${node.lang}`)
        const { data: _data, ...source } = node
        return source
      }
      return node.children ? { ...node, children: node.children.map(withoutHighlights) } : node
    }
    assert.deepEqual(withoutHighlights(tree), markdownTree(doc.markdown), doc.id)
    assert.deepEqual(document.headings, documentHeadings(doc.markdown), doc.id)
  }
  const publicCatalog = JSON.parse(await readFile(path.join(root, '.generated/reference.json'), 'utf8'))
  assert.deepEqual(publicCatalog, JSON.parse(JSON.stringify(catalog)))
})

test('prepared Reference highlights match live code, declarations and source/result pairs', async () => {
  for (const id of ['rules/modes', 'tokens/color', 'packages', 'directives/theme', 'tools/mcp']) {
    const doc = catalog.documents.find(doc => doc.id === id)!
    const payload = JSON.parse(await readFile(path.join(root, '.generated/reference-documents', 'en', `${encodeURIComponent(id)}.json`), 'utf8'))
    async function verify(nodes: any[], compact = false) {
      for (let index = 0; index < nodes.length; index++) {
        const node = nodes[index]
        if (!compact && isStylesheetExample(node, nodes[index + 1], nodes[index + 2])) {
          await verifyCode(nodes[++index], true)
          await verifyCode(nodes[++index], true)
        } else if (node.type === 'code') await verifyCode(node)
        else if (node.children) await verify(node.children)
      }
    }
    async function verifyCode(node: any, example = false) {
      const props = referenceCodeProps(node, example)
      assert.deepEqual(node.data.prepared, await prepareCode(await highlightCode(node.value, {
        lang: props.lang, beautify: !!props.beautify, dedent: props.dedent
      })), `${id}: ${node.lang} ${node.meta ?? ''}`)
    }
    await verify(payload.tree.children)
  }
})

test('prepared trees reuse stable highlights and invalidate Markdown or renderer inputs', async () => {
  const doc = catalog.documents.find(doc => doc.id === 'rules/modes')!
  const first = await createReferenceRenderDocument(doc, 'version-one')
  const reused = await createReferenceRenderDocument({ ...doc, title: 'Updated title' }, 'version-one', first)
  assert.equal(reused.tree, first.tree)
  assert.equal(reused.title, 'Updated title')
  const changedMarkdown = await createReferenceRenderDocument({ ...doc, markdown: `${doc.markdown}\n\nAdditional prose.` }, 'version-one', first)
  assert.notEqual(changedMarkdown.renderDigest, first.renderDigest)
  assert.notEqual(changedMarkdown.tree, first.tree)
  const changedPipeline = await createReferenceRenderDocument(doc, 'version-two', first)
  assert.notEqual(changedPipeline.renderDigest, first.renderDigest)
  assert.notEqual(changedPipeline.tree, first.tree)
  assert.deepEqual(changedPipeline.tree, first.tree)
})

test('render fingerprint tracks grammar, native artifact and module resolution inputs', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'reference-render-'))
  const siteRoot = path.join(directory, 'site')
  const grammar = path.join(directory, 'packages/language-service/syntaxes/master-css.tmLanguage.json')
  const native = path.join(directory, 'packages/binding/native/tooling.node')
  const inputs = [path.join(siteRoot, 'tsconfig.json'), grammar, native, ...['bun.lock', 'bunfig.toml', 'scripts/typescript-api.mjs', 'scripts/typescript-declarations.mjs'].map(file => path.join(directory, file))]
  try {
    for (const file of inputs) {
      await mkdir(path.dirname(file), { recursive: true })
      await writeFile(file, '{}')
    }
    let previous = await referenceRenderVersion(siteRoot)
    assert.equal(await referenceRenderVersion(siteRoot), previous)
    for (const file of inputs) {
      await writeFile(file, 'updated input')
      const next = await referenceRenderVersion(siteRoot)
      assert.notEqual(next, previous, file)
      previous = next
    }
  } finally { await rm(directory, { recursive: true, force: true }) }
})

test('a transitive parser dependency invalidates warm prepared trees without hashing unrelated home files', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'reference-render-dependencies-'))
  const siteRoot = path.join(directory, 'site')
  const parser = path.join(siteRoot, 'framework/parser.ts')
  const helper = path.join(siteRoot, 'framework/heading-ids.ts')
  const unrelated = path.join(siteRoot, 'framework/home.ts')
  try {
    await mkdir(path.join(siteRoot, 'adapters'), { recursive: true })
    await mkdir(path.dirname(parser), { recursive: true })
    await writeFile(path.join(siteRoot, 'adapters/highlight.ts'), 'export { parse } from "../framework/parser.ts"')
    await writeFile(parser, 'export { parse } from "./heading-ids.ts"')
    await writeFile(helper, 'export const parse = "original parser"')
    await writeFile(unrelated, 'export const hero = "unrelated homepage"')
    const document = { ...catalog.documents.find(doc => doc.id === 'grid-tracks')!, markdown: '## Overview {#overview}\n\nA parser cache fixture.', headings: [{ id: 'overview', title: 'Overview', depth: 2 }] }
    const version = await referenceRenderVersion(siteRoot)
    const previous = structuredClone(await createReferenceRenderDocument(document, version))
    // Reproduce a warm payload from before the parser attached explicit heading metadata.
    delete (previous.tree.children[0] as any).data
    const reused = await createReferenceRenderDocument(document, await referenceRenderVersion(siteRoot), previous)
    assert.equal(reused.tree, previous.tree)
    await writeFile(unrelated, 'export const hero = "updated homepage"')
    assert.equal(await referenceRenderVersion(siteRoot), version)
    await writeFile(helper, 'export const parse = "parser with heading metadata"')
    const nextVersion = await referenceRenderVersion(siteRoot)
    assert.notEqual(nextVersion, version)
    const rebuilt = await createReferenceRenderDocument(document, nextVersion, previous)
    assert.notEqual(rebuilt.tree, previous.tree)
    assert.equal((rebuilt.tree.children[0] as any).data.hProperties.id, 'overview')
    assert.deepEqual(rebuilt.tree, markdownTree(document.markdown))
  } finally { await rm(directory, { recursive: true, force: true }) }
})

test('changing a configured token updates class output, extracted Markdown and search together', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'reference-example-'))
  try {
    for (const value of ['1.5rem', '2rem']) {
      const source = `@theme { --spacing-card: ${value};  }`
      const file = path.join(directory, 'content.mdx')
      await writeFile(file, `<ConfiguredExample source={${JSON.stringify(source)}} classes={['p-card']} />`)
      const extracted = await extractReferenceMdx(file)
      const pageCSS = configuredExampleCSS(source, ['p-card'])
      assert.match(pageCSS, new RegExp(`--spacing-card:${value.replace('.', '\\.')}`))
      assert.ok(extracted.markdown.includes(pageCSS))
      assert.ok(extractSearchNodesFromMarkdown(extracted.markdown).some(node => node.text.includes(`--spacing-card:${value}`)))
    }
  } finally { await rm(directory, { recursive: true, force: true }) }
  assert.throws(() => configuredExampleCSS('@theme { --spacing-card: 1.5rem;  }', ['p:missing-reference-token']), /Invalid configured documentation class/)
})

test('tool catalogs retain discovery, effects and source links without copying full schemas', async () => {
  const { listMCPTools } = await import('./tool-contracts')
  const tools = await listMCPTools(path.join(root, '../packages/mcp/dist/bin/index.js'))
  const mcp = catalog.documents.find(doc => doc.id === 'tools/mcp')!
  const cli = catalog.documents.find(doc => doc.id === 'tools/cli')!
  assert.equal(catalog.documents.filter(doc => doc.kind === 'tool').length, 2)
  for (const tool of tools) {
    assert.ok(mcp.aliases.includes(tool.name), tool.name)
    assert.ok(mcp.headings.some(heading => heading.id === tool.name), tool.name)
  }
  assert.match(mcp.markdown, /tools\/list/)
  assert.match(mcp.markdown, /writes workspace files/)
  assert.match(mcp.markdown, /output-schema\.ts/)
  for (const name of ['generate', 'lint', 'inspect', 'suggest']) {
    assert.ok(cli.aliases.includes(`master-css ${name}`))
    assert.ok(cli.markdown.includes(`master-css ${name} --help`))
  }
  assert.match(cli.markdown, /--fix-dry-run/)
  for (const doc of [mcp, cli]) {
    assert.doesNotMatch(doc.markdown, /disclosure=(?:input-schema|output-schema|command-help)/)
    assert.ok(!catalog.documents.some(other => other.id.startsWith(doc.id + '/')))
  }
})

test('directive contracts keep each definition and example with its content owner', async () => {
  const { directivePages } = await import('./editorial')
  const contract = await extractReferenceMdx(path.join(root, 'content/guide/directives/contract.mdx'))
  const sections = documentHeadings(contract.markdown).filter(heading => heading.depth === 2).map(heading => heading.id)
  assert.deepEqual(directivePages.flatMap(page => page.sections).sort(), sections.sort(), 'Every authored section must have exactly one published owner')
  const { directiveExamples } = await import('../tests/directive-examples')
  const { stylesheetExampleMarkdown } = await import('@master/internal-site/css/stylesheet-example.ts')
  const docs = catalog.documents.filter(doc => doc.kind === 'directive')
  assert.equal(docs.length, 6)
  const owners: Record<string, string[]> = {
    imports: ['import-mastercss', 'reference', 'publish-stylesheet-assets'],
    theme: ['theme', 'theme-inline', 'theme-static', 'theme-mode'],
    queries: ['custom-media', 'custom-container'],
    definitions: ['utilities', 'reusing-a-matched-value', 'contents', 'whole-definition-replacement'],
    scanning: ['source', 'source-not', 'safelist', 'blocklist'],
    pruning: ['prune-native', 'preserve-native', 'native-keyframes']
  }
  for (const [owner, anchors] of Object.entries(owners)) {
    const doc = docs.find(doc => doc.id === `directives/${owner}`)!
    for (const id of anchors) {
      assert.ok(doc.headings.some(heading => heading.id === id), `${doc.id}#${id}`)
      assert.equal(docs.filter(other => other.headings.some(heading => heading.id === id)).length, 1, id)
    }
    assert.match(doc.markdown, /reference-illustration:/, doc.id)
  }
  const exampleOwners: Record<string, string> = {
    'Scoped tokens in native CSS': 'theme',
    'Native keyframes': 'pruning',
    'A parameter utility': 'definitions',
    'A named media condition': 'queries',
    'A named container condition': 'queries'
  }
  for (const doc of docs) {
    assert.notEqual(doc.description, 'Stylesheet directives, their scope and effects.')
    assert.doesNotMatch(doc.markdown, /## Related contracts/)
  }
  for (const example of directiveExamples) {
    const matching = docs.filter(doc => doc.markdown.includes(`**${example.title}**`))
    assert.equal(matching.length, 1, example.title)
    assert.equal(matching[0].id, `directives/${exampleOwners[example.title]}`)
    assert.ok(matching[0].markdown.includes(await stylesheetExampleMarkdown(example.title, example.source)))
  }
})


test('package catalog covers public exports and preserves qualified symbol discovery', async () => {
  const contract = JSON.parse(await readFile(path.join(root, '../.ai/contracts/public-api.json'), 'utf8'))
  const census = JSON.parse(await readFile(path.join(root, '../.ai/contracts/api-census.json'), 'utf8'))
  const docs = catalog.documents.filter(doc => doc.kind === 'package')
  assert.equal(docs.length, 1)
  const doc = docs[0]
  assert.equal(doc.id, 'packages')
  for (const [name, pkg] of Object.entries<any>(contract.packages)) {
    if (!pkg.exports.length || !census.records.some((record: any) => record.package === name && record.visibility === 'public')) continue
    assert.ok(doc.aliases.includes(name), name)
    assert.ok(doc.markdown.includes(`https://github.com/master-co/css/tree/rc/packages/${pkg.directory}`), name)
    for (const subpath of pkg.exports) {
      const specifier = name + (subpath === '.' ? '' : subpath.slice(1))
      assert.ok(doc.markdown.includes(`| \`${specifier}\` |`), specifier)
      for (const symbol of pkg.entrypoints[subpath] ?? []) assert.equal(doc.identifierAnchors?.[`${specifier}#${symbol}`], name.replace('@master/', ''))
    }
  }
  assert.doesNotMatch(doc.markdown, /```typescript declaration|### createEngine/)
})

test('Reference overview exports the complete current catalog with matching search sections', async () => {
  const { referenceOverviewMarkdown } = await import('./navigation-data')
  const markdown = referenceOverviewMarkdown(catalog.documents)
  for (const doc of catalog.documents) {
    assert.ok(markdown.includes(`[${doc.title}](${doc.url})`), doc.id)
  }
  const editions = JSON.parse(await readFile(path.join(root, '.generated/reference-route-indexes.json'), 'utf8'))
  for (const locale of Object.keys(editions)) {
    const prefix = locale === 'en' ? '' : `${locale}/`
    const edition = locale === 'en' ? catalog : JSON.parse(await readFile(path.join(root, `.generated/reference.${locale}.json`), 'utf8'))
    const overviewMarkdown = referenceOverviewMarkdown(edition.documents, locale)
    const exported = await readFile(path.join(root, `public/${prefix}reference.md`), 'utf8')
    assert.ok(exported.includes(localizeReferenceMarkdown(overviewMarkdown, locale)))
    const search = JSON.parse(await readFile(path.join(root, `public/search/${locale}.json`), 'utf8'))
    const overview = search.find((page: any) => page.url === `/${prefix}reference`)
    assert.deepEqual(overview.nodes, extractSearchNodesFromMarkdown(overviewMarkdown))
  }
})
