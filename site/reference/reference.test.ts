import assert from 'node:assert/strict'
import { test, before } from 'node:test'
import { readFile, readdir, mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createDocumentationSearch } from 'internal/utils/documentation-search'
import { extractSearchNodesFromMdx } from 'internal/utils/search-pages'
import { generateReference, renderDocumentMarkdown } from './build'
import { searchTasks } from './search-tasks'
import type { ReferenceCatalog } from './types'
import { generatePresetCSS } from '../common/generate-preset-css'
import SyntaxTr from '../components/SyntaxTr'
import { resolveSyntaxRow } from './syntax'
import resolveHeading from 'internal/utils/resolve-heading'
import { extractReferenceMdx } from './markdown'
import { configuredExampleCSS, configuredExampleHTML } from './configured-example'
import legacyAnchors from './legacy-anchors.json' with { type: 'json' }
import { collectCSSVariableReferences } from '../scripts/css-variable-references'
import { flattenMasterCSSManifestVariables } from '@master/css-schema/manifest'
import preset from '../utils/preset-manifest'
import { compileManifestSync } from '@master/css-compiler/node'
import { legacySyntaxPages, type LegacySyntaxSlug } from '../utils/legacy-syntax'
import { syntaxTutorialContent } from '../utils/syntax-tutorial'

const root = fileURLToPath(new URL('../', import.meta.url))
let catalog: ReferenceCatalog
before(async () => { catalog = await generateReference(root) })

test('Reference and shared search styles use defined site theme variables', async () => {
  const theme = await readFile(path.join(root, '../internal/styles/theme.css'), 'utf8')
  const { manifest } = compileManifestSync(theme, { baseManifest: preset })
  const names = new Set(flattenMasterCSSManifestVariables(manifest.variables).map(variable => variable.name))
  for (const file of ['styles/reference.css', 'styles/documentation-index.css', '../internal/styles/documentation-search.css']) {
    const css = await readFile(path.join(root, file), 'utf8')
    for (const name of collectCSSVariableReferences(css)) assert.ok(names.has(name), `${file}: --${name}`)
  }
})

test('every existing utility has a document and no component silently loses its text', async () => {
  const candidates = (await readdir(path.join(root, 'app/[locale]/reference'), { withFileTypes: true })).filter(entry => entry.isDirectory() && !entry.name.startsWith('['))
  const directories = (await Promise.all(candidates.map(async entry => await readFile(path.join(root, 'app/[locale]/reference', entry.name, 'metadata.ts')).then(() => entry, () => null)))).filter(Boolean)
  assert.equal(catalog.documents.filter(doc => doc.kind === 'utility').length, directories.length)
  assert.equal(new Set(catalog.documents.map(doc => doc.id)).size, catalog.documents.length)
  for (const doc of catalog.documents) {
    assert.deepEqual(doc.extractionNotes, [], doc.id)
    for (const id of doc.related) assert.ok(catalog.documents.some(doc => doc.id === id), `${doc.id} → ${id}`)
    for (const [identifier, anchor] of Object.entries(doc.identifierAnchors ?? {})) {
      assert.ok(doc.headings.some(heading => heading.id === anchor), `${doc.id}: ${identifier} → ${anchor}`)
    }
  }
})

test('30 acceptance queries find the intended document in the first three results', async () => {
  for (const locale of ['en', 'tw']) {
    const pages = JSON.parse(await readFile(path.join(root, `public/search/${locale}.json`), 'utf8'))
    const search = createDocumentationSearch(pages)
    const failures = searchTasks.filter(([query, id]) => !search(query, 3).some(result => result.page.url.endsWith(`/reference/${id}`)))
    assert.ok(failures.length <= 3, `${locale}: ${JSON.stringify(failures)}`)
    const padding = search('pxs:', 1)[0]
    assert.equal(padding.page.title, 'padding')
    assert.match(padding.excerpt, /padding-inline-start/)
    assert.match(padding.href, /#syntax-/)
    assert.ok(search('opacity:.5', 1)[0].href.endsWith('/reference/opacity'))
    assert.ok(search('@compose', 1)[0].href.endsWith('/reference/directives/compose#compose'))
    assert.match(search('@master/css#createEngine', 1)[0].href, /\/reference\/packages\/css#api-/)
    for (const page of pages.filter((page: any) => page.identifiers)) {
      for (const identifier of page.identifiers) assert.ok(search(identifier.text, 1).length, `${identifier.text} has no results`)
    }
  }
})

test('padding and opacity syntax rows have the same identifiers and declarations in the page renderer and Markdown', async () => {
  for (const id of ['padding', 'opacity']) {
    const doc = catalog.documents.find(doc => doc.id === id)!
    const syntaxes = (await import(path.join(root, `app/[locale]/reference/${id}/syntaxes.ts`))).default
    const markdown = renderDocumentMarkdown(doc, catalog)
    for (const syntax of syntaxes) {
      const row = resolveSyntaxRow(syntax)
      const element = await SyntaxTr({ value: syntax })
      const collect = (node: any): string => Array.isArray(node) ? node.map(collect).join('') : node?.props ? collect(node.props.children) : typeof node === 'string' || typeof node === 'number' ? String(node) : ''
      const text = collect(element)
      assert.equal(element.props.id, row.id)
      assert.ok(markdown.includes(`id="${row.id}"`))
      assert.ok(markdown.includes(row.syntax))
      assert.ok(text.includes(row.declarations.trim()), row.syntax)
      assert.ok(markdown.includes(row.declarations))
    }
  }
})

test('pilot examples reproduce full CSS and the prose states the correct breakpoint and dependencies', () => {
  for (const id of ['padding', 'opacity', 'rules/conditions']) {
    const doc = catalog.documents.find(doc => doc.id === id)!
    assert.ok(doc.examples.length, id)
    for (const example of doc.examples) {
      assert.equal(example.css, generatePresetCSS(example.classes), `${id}: ${example.title}`)
      assert.ok(doc.markdown.includes(example.css))
    }
  }
  const conditions = catalog.documents.find(doc => doc.id === 'rules/conditions')!
  assert.match(conditions.markdown, /@sm` applies `\(width>=52\.125rem\)`/)
  assert.match(conditions.examples[0].css, /prefers-color-scheme:light/)
  assert.match(conditions.examples[0].css, /prefers-color-scheme:dark/)
  assert.match(conditions.examples[0].css, /@layer utilities/)
  const padding = catalog.documents.find(doc => doc.id === 'padding')!
  assert.equal(padding.rows.length, 16)
  assert.match(padding.markdown, /--spacing-md.*1rem/)
  assert.match(padding.markdown, /not always horizontal and vertical/)
  assert.match(catalog.documents.find(doc => doc.id === 'opacity')!.markdown, /does not disable a button/)
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

test('all pre-migration utility and Guide anchors remain available', async () => {
  const missing: string[] = []
  for (const page of legacyAnchors.pages) {
    const slug = page.source.match(/\/guide\/([^/]+)\/content.mdx$/)?.[1]
    if (slug && Object.hasOwn(legacySyntaxPages, slug)) {
      const anchors = legacySyntaxPages[slug as LegacySyntaxSlug].anchors
      for (const id of page.anchors) if (!Object.hasOwn(anchors, id)) missing.push(`${page.source}#${id}`)
      continue
    }
    const source = await readFile(path.join(root, '..', page.source), 'utf8')
    const ids = new Set(extractSearchNodesFromMdx(source).filter(node => node.id).map(node => node.id))
    for (const match of source.matchAll(/<a id="([^"]+)"/g)) ids.add(match[1])
    for (const id of page.anchors) if (!ids.has(id)) missing.push(`${page.source}#${id}`)
  }
  assert.deepEqual(missing, [])
})

test('Reference links and preserved Guide anchors resolve to real documents and sections', async () => {
  for (const doc of catalog.documents) {
    for (const match of doc.markdown.matchAll(/\]\((\/reference\/[^\s)]+)\)/g)) {
      const [url, anchor] = match[1].split('#')
      const target = catalog.documents.find(doc => doc.url === url.replace(/\.md$/, ''))
      assert.ok(target, `${doc.id}: ${match[1]}`)
      if (anchor) assert.ok(target.headings.some(heading => heading.id === anchor) || target.rows.some(row => row.id === anchor), `${doc.id}: ${match[1]}`)
    }
  }
  for (const doc of catalog.documents.filter(doc => doc.kind === 'rule')) {
    const [guideURL, guideAnchor] = doc.guide!.split('#')
    const guide = await readFile(path.join(root, `app/[locale]${guideURL}/content.mdx`), 'utf8')
    if (guideAnchor) {
      assert.ok(extractSearchNodesFromMdx(guide).some(node => node.id === guideAnchor), doc.guide)
      continue
    }
    const source = await readFile(path.join(root, '..', doc.source), 'utf8')
    for (const heading of extractSearchNodesFromMdx(source).filter(node => node.id)) assert.ok(guide.includes(`id="${heading.id}"`), `${doc.guide}#${heading.id}`)
  }
})

test('all 120 retired Guide anchors target an existing Reference section', () => {
  let count = 0
  for (const page of Object.values(legacySyntaxPages)) for (const target of Object.values(page.anchors)) {
    const [url, anchor] = target.split('#')
    const doc = catalog.documents.find(doc => doc.url === url)
    assert.ok(doc?.headings.some(heading => heading.id === anchor), target)
    count++
  }
  assert.equal(count, 120)
})

test('Syntax Tutorial exports its complete configured button, CSS, headings and searchable output', async () => {
  const tutorial = await syntaxTutorialContent(root)
  assert.deepEqual(tutorial.notes, [])
  assert.doesNotMatch(tutorial.markdown, /Look up a rule|<ButtonPreview|MCSS_EXPRESSION|\{#/)
  for (const anchor of ['declarations', 'states', 'conditions', 'composition', 'project-settings', 'complete-button']) assert.ok(tutorial.markdown.includes(`id="${anchor}"`), anchor)
  const example = tutorial.examples.find(example => example.configuration)!
  assert.ok(example.configuration?.includes("@import '@master/css'"))
  const expectedHTML = `<button type="button" class="${example.classes.join(' ')}">Save</button>`
  assert.ok(tutorial.markdown.includes(expectedHTML))
  assert.equal(configuredExampleHTML(example.classes, 'button', 'Save'), expectedHTML)
  assert.ok(tutorial.markdown.includes(example.css))
  assert.match(example.css, /--spacing-action:1rem/)
  assert.match(example.css, /:hover\{color:var\(--color-blue-60\)/)
  assert.match(example.css, /:focus-visible\{color:var\(--color-blue-60\)/)
  assert.match(example.css, /@media \(width>=52\.125rem\)/)
  assert.match(configuredExampleCSS(example.configuration!.replace('1rem', '1.25rem'), example.classes), /--spacing-action:1.25rem/)
  for (const locale of ['en', 'tw']) {
    const searchPages = JSON.parse(await readFile(path.join(root, `public/search/${locale}.json`), 'utf8'))
    const canonical = (url: string) => url.replace(/^\/(en|tw)(?=\/)/, '')
    const page = searchPages.find((page: any) => canonical(page.url) === '/guide/syntax-tutorial')
    assert.deepEqual(page.nodes, extractSearchNodesFromMdx(tutorial.markdown))
    for (const slug of Object.keys(legacySyntaxPages)) assert.ok(!searchPages.some((page: any) => canonical(page.url) === `/guide/${slug}`))
  }
})

test('machine index and localized Markdown identify the same content and source revision', async () => {
  const index = JSON.parse(await readFile(path.join(root, 'public/reference/index.json'), 'utf8'))
  assert.equal(index.revision, catalog.revision)
  for (const id of ['opacity', 'padding', 'rules/conditions']) {
    const en = await readFile(path.join(root, `public/reference/${id}.md`), 'utf8')
    const tw = await readFile(path.join(root, `public/tw/reference/${id}.md`), 'utf8')
    assert.ok(en.includes(catalog.version) && tw.includes(catalog.version))
    assert.match(tw, /English fallback/)
    assert.equal(en.match(/Content digest: (.+)/)?.[1], tw.match(/Content digest: (.+)/)?.[1])
  }
})

test('changing a configured token updates class output, extracted Markdown and search together', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'reference-example-'))
  try {
    for (const value of ['1.5rem', '2rem']) {
      const source = `@theme { --spacing-card: ${value}; }`
      const file = path.join(directory, 'content.mdx')
      await writeFile(file, `<ConfiguredExample source={${JSON.stringify(source)}} classes={['p:card']} />`)
      const extracted = await extractReferenceMdx(file)
      const pageCSS = configuredExampleCSS(source, ['p:card'])
      assert.match(pageCSS, new RegExp(`--spacing-card:${value.replace('.', '\\.')}`))
      assert.ok(extracted.markdown.includes(pageCSS))
      assert.ok(extractSearchNodesFromMdx(extracted.markdown).some(node => node.text.includes(`--spacing-card:${value}`)))
    }
  } finally { await rm(directory, { recursive: true, force: true }) }
  assert.throws(() => configuredExampleCSS('@theme { --spacing-card: 1.5rem; }', ['p:missing-reference-token']), /Invalid configured documentation class/)
})
