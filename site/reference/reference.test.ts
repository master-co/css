import assert from 'node:assert/strict'
import { test, before } from 'node:test'
import { readFile, readdir, mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createDocumentationSearch } from '~/site/docs-shell/utils/documentation-search'
import { extractSearchNodesFromMdx } from '~/site/docs-shell/utils/search-pages'
import { generateReference, renderDocumentMarkdown } from './build'
import { searchTasks } from './search-tasks'
import type { ReferenceCatalog } from './types'
import { generatePresetCSS } from '../common/generate-preset-css'
import SyntaxTr from '../components/SyntaxTr'
import { resolveSyntaxRow } from './syntax'
import resolveHeading from '~/site/docs-shell/utils/resolve-heading'
import { extractReferenceMdx } from './markdown'
import { configuredExampleCSS, configuredExampleHTML, configuredMarkupClasses } from './configured-example'
import legacyAnchors from './legacy-anchors.json' with { type: 'json' }
import { collectCSSVariableReferences } from '../scripts/css-variable-references'
import { flattenMasterCSSManifestVariables } from '@master/css-schema/manifest'
import preset from '../utils/preset-manifest'
import { compileManifestSync } from '@master/css-compiler/node'
import { legacySyntaxPages, type LegacySyntaxSlug } from '../utils/legacy-syntax'
import { syntaxTutorialContent } from '../utils/syntax-tutorial'
import { markdownTree } from '~/site/docs-shell/utils/markdown-tree'
import { tokenValueEntry } from './value-entry'
import { documentHeadings } from './headings'
import { variableNamespaceSources, variableNamespaceSourcesMarkdown } from '../utils/variable-namespace-sources'

const root = fileURLToPath(new URL('../', import.meta.url))
let catalog: ReferenceCatalog
before(async () => { catalog = await generateReference(root) })

test('Reference and shared search styles use defined site theme variables', async () => {
  const theme = await readFile(path.join(root, 'styles/docs-shell/theme.css'), 'utf8')
  const { manifest } = compileManifestSync(theme, { baseManifest: preset })
  const names = new Set(flattenMasterCSSManifestVariables(manifest.variables).map(variable => variable.name))
  for (const file of ['styles/reference.css', 'styles/documentation-index.css', 'styles/documentation-values.css', 'styles/docs-shell/documentation-search.css']) {
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
  assert.match(catalog.documents.find(doc => doc.id === 'opacity')!.markdown, /does not disable a control/)
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
    assert.equal(configured.length, id === 'rules/layers' ? 6 : 2, id)
    for (const example of configured) {
      assert.equal(example.css, configuredExampleCSS(example.configuration!, example.classes))
      assert.ok(doc.markdown.includes(example.css))
      assert.match(example.css, /@layer (?:base|defaults|utilities|components)/)
    }
  }
  const modes = catalog.documents.find(doc => doc.id === 'rules/modes')!
  assert.ok(modes.markdown.includes(variableNamespaceSourcesMarkdown()))
  // A registry-backed consumer may have no value in the preset: order was missing
  // when this index was incorrectly derived from the defined variable inventory.
  assert.deepEqual(variableNamespaceSources.find(row => row.namespace === 'order')?.consumers, ['order:'])
  assert.ok(variableNamespaceSources.find(row => row.namespace === 'spacing')?.consumers.includes('scroll-padding-inline-end:'))
  assert.ok(variableNamespaceSources.find(row => row.namespace === 'container')?.consumers.includes('@container(md)'))
  for (const row of variableNamespaceSources) for (const consumer of row.consumers) assert.ok(renderDocumentMarkdown(modes, catalog).includes(`\`${consumer}\``))
  const layers = catalog.documents.find(doc => doc.id === 'rules/layers')!
  assert.ok(layers.headings.some(heading => heading.id === 'summary' && heading.title === 'Defaults stay below local decisions'))
  assert.ok(layers.headings.some(heading => heading.id === 'layer-checklist'))
  assert.match(layers.markdown, /!important` reverses the order between layers/)
  const base = layers.examples.find(example => example.classes.includes('list-style:none_ul@base'))!
  assert.match(base.css, /@layer base\{.*list-style:none/)
  const fonts = layers.examples.find(example => example.classes.includes('font:mono_:is(code,pre)@default'))!
  assert.match(fonts.css, /--font-family-mono:/)
  assert.match(fonts.css, /font-family:var\(--font-family-mono\)/)
  assert.deepEqual(configuredMarkupClasses('<ul class="list-style:none p:card"><li class="p:card">One</li></ul>'), ['list-style:none', 'p:card'])
  assert.throws(() => configuredExampleCSS('', ['list-style:10px']), /Invalid configured documentation class/)
})

test('compact token lists preserve every native value, heading and identifier in the normalized body', () => {
  const variables = flattenMasterCSSManifestVariables(preset.variables)
  for (const doc of catalog.documents.filter(doc => doc.kind === 'tokens')) {
    const nodes = markdownTree(doc.markdown).children
    const rows = nodes.flatMap((node: any, index) => {
      const entry = tokenValueEntry(nodes, index)
      return entry ? [{ ...entry.row, title: node.children[0].value }] : []
    })
    const entries = variables.filter(variable => `tokens/${variable.namespace}` === doc.id)
    assert.equal(rows.length, entries.length, doc.id)
    if (!entries.length) continue // Named-condition documents retain complete CSS code blocks.
    assert.deepEqual(rows.map(row => row.title), doc.headings.filter(heading => heading.depth === 3).map(heading => heading.title), doc.id)
    for (const [index, variable] of entries.entries()) {
      const row = rows[index]
      assert.equal(row.title, variable.key)
      assert.equal(row.identifier, `--${variable.name}`)
      assert.equal(doc.identifierAnchors?.[row.identifier], doc.headings.find(heading => heading.title === row.title && heading.depth === 3)?.id)
      assert.deepEqual(row.values, [
        ...(variable.value === undefined ? [] : [{ label: 'Default', value: String(variable.value) }]),
        ...Object.entries(variable.modes ?? {}).map(([mode, value]) => ({ label: mode, value: String(value.value) }))
      ])
      for (const value of row.values) assert.ok(renderDocumentMarkdown(doc, catalog).includes(`${value.label}: ${value.value}`))
    }
  }
})

test('language contracts export portable examples, complete CSS and stable section anchors', () => {
  for (const id of ['rules/declarations', 'rules/selectors', 'rules/conditions', 'rules/extraction']) {
    const doc = catalog.documents.find(doc => doc.id === id)!
    const markdown = renderDocumentMarkdown(doc, catalog)
    const anchors = new Set([...documentHeadings(markdown).map(heading => heading.id), ...[...markdown.matchAll(/<a id="([^"]+)"><\/a>/g)].map(match => match[1])])
    for (const heading of doc.headings) assert.ok(anchors.has(heading.id), `${id}#${heading.id}`)
    assert.doesNotMatch(markdown, /className=|MCSS_EXPRESSION|<(?:Demo|Class2CSS|ConfiguredExample)\b/)
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
  assert.match(extraction, /w:var\(--progress\)/)
  assert.match(extraction, /setAttribute\('aria-valuenow'/)
  assert.doesNotMatch(extraction, /(?:font-size|w):\$/)
  const conditions = renderDocumentMarkdown(catalog.documents.find(doc => doc.id === 'rules/conditions')!, catalog)
  assert.match(conditions, /container:sidebar\/inline-size/)
  assert.match(conditions, /@supports\(backdrop-filter:blur\(0px\)\)/)
  assert.doesNotMatch(conditions, /`css @/)
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

test('tool references preserve every public input, complete raw contracts and stable headings', async () => {
  const { listMCPTools } = await import('./tool-contracts')
  const { mcpEditorial } = await import('./mcp-editorial')
  const { cliEditorial } = await import('./cli-editorial')
  const { schemaParameters, cliParameters, parametersMarkdown } = await import('./tool-parameters')
  const { execFileSync } = await import('node:child_process')
  const previous = JSON.parse(await readFile(path.join(root, 'tests/tool-contract-heading-ids.json'), 'utf8'))
  const tools = await listMCPTools(path.join(root, '../packages/mcp/dist/bin/index.js'))
  assert.deepEqual(tools.map(tool => tool.name).sort(), Object.keys(mcpEditorial).sort())
  for (const tool of tools) {
    const doc = catalog.documents.find(doc => doc.id === `tools/mcp/${tool.name}`)!
    const editorial = mcpEditorial[tool.name]
    const schema = markdownTree(doc.markdown).children.find((node: any) => node.type === 'code' && node.meta === 'disclosure=input-schema') as any
    assert.deepEqual(JSON.parse(schema.value), tool.inputSchema, tool.name)
    assert.ok(doc.markdown.includes(parametersMarkdown(schemaParameters(tool.inputSchema, editorial.fields))))
    const example = markdownTree(doc.markdown).children.find((node: any) => node.type === 'code' && node.meta === 'name=Arguments') as any
    assert.deepEqual(JSON.parse(example.value), editorial.example)
    for (const text of [editorial.purpose, editorial.output, editorial.lifecycle, editorial.exampleNote]) assert.ok(doc.markdown.includes(text))
    for (const heading of previous[doc.id]) assert.ok(doc.headings.some(item => item.id === heading.id), `${doc.id}#${heading.id}`)
  }
  for (const command of Object.keys(cliEditorial)) {
    const doc = catalog.documents.find(doc => doc.id === `tools/cli/${command}`)!
    const help = execFileSync(process.execPath, [path.join(root, '../packages/cli/dist/bin/index.js'), command, '--help'], { encoding: 'utf8' }).trim()
    const raw = markdownTree(doc.markdown).children.find((node: any) => node.type === 'code' && node.meta === 'disclosure=command-help') as any
    assert.equal(raw.value, help)
    const rows = cliParameters(help)
    assert.ok(doc.markdown.includes(parametersMarkdown(rows)))
    assert.equal(rows.length, help.split('\n').filter(line => /^ {2}(?:source paths|(?:-\w, )?--)/.test(line)).length)
    for (const example of cliEditorial[command].examples) assert.ok(doc.markdown.includes(example.command))
    for (const heading of previous[doc.id]) assert.ok(doc.headings.some(item => item.id === heading.id), `${doc.id}#${heading.id}`)
  }
})

test('nested parameter presentation retains requirements, bounds and descriptions without inventing inputs', async () => {
  const { schemaParameters } = await import('./tool-parameters')
  const schema = { type: 'object', properties: { range: { type: 'object', properties: { line: { type: 'integer', minimum: 0, maximum: 12 } }, required: ['line'] }, mode: { type: 'string', enum: ['auto', 'native'] } }, required: ['mode'] }
  const descriptions = { range: 'Selected range.', 'range.line': 'Zero-based line.', mode: 'Execution binding.' }
  assert.deepEqual(schemaParameters(schema, descriptions), [
    { name: 'range', type: 'object', requirement: 'Optional', description: 'Selected range.' },
    { name: 'range.line', type: 'integer', requirement: 'Required when parent is provided', description: 'Zero-based line. Minimum: 0. Maximum: 12.' },
    { name: 'mode', type: 'string', requirement: 'Required', description: 'Execution binding. Values: `auto`, `native`.' }
  ])
  assert.throws(() => schemaParameters(schema, {}), /Missing parameter description/)
  assert.throws(() => schemaParameters(schema, { ...descriptions, typo: 'No such field.' }), /Stale parameter description/)
})


test('directive contracts preserve stable entrances and complete compiled stylesheet examples', async () => {
  const previous = JSON.parse(await readFile(path.join(root, 'tests/directive-heading-ids.json'), 'utf8'))
  const { directiveExamples } = await import('../tests/directive-examples')
  const { stylesheetExampleMarkdown } = await import('./stylesheet-example')
  const docs = catalog.documents.filter(doc => doc.kind === 'directive')
  assert.equal(docs.length, 10)
  for (const doc of docs) {
    const exported = renderDocumentMarkdown(doc, catalog)
    for (const heading of previous[doc.id]) assert.ok(doc.headings.some(item => item.id === heading.id) || exported.includes(`id="${heading.id}"`), `${doc.id}#${heading.id}`)
    assert.notEqual(doc.description, 'Stylesheet directives, their scope and effects.')
    assert.doesNotMatch(doc.markdown, /## Related contracts/)
  }
  for (const example of directiveExamples) {
    const matching = docs.filter(doc => doc.markdown.includes(`**${example.title}**`))
    assert.equal(matching.length, 1, example.title)
    assert.ok(matching[0].markdown.includes(await stylesheetExampleMarkdown(example.title, example.source)))
  }
  const settings = docs.find(doc => doc.id === 'directives/settings')!
  assert.match(settings.markdown, /Setting \| Default \| Effect/)
  assert.match(settings.markdown, /`root-size` \| `16`/)
  assert.match(settings.markdown, /`scope` \| `not set`/)
})


test('package declarations preserve every export and anchor without exposing implementation', async () => {
  const { ts } = await import('./package-declarations')
  const { verifyDeclarationPresentation } = await import('../tests/package-declarations')
  await verifyDeclarationPresentation()
  const previous = JSON.parse(await readFile(path.join(root, 'tests/package-heading-ids.json'), 'utf8'))
  const packages = catalog.documents.filter(doc => doc.kind === 'package')
  assert.equal(packages.length, 20)
  for (const doc of packages) {
    assert.deepEqual(doc.headings, previous[doc.id], doc.id)
    assert.match(doc.markdown, /\| Import path \| Purpose \|/, doc.id)
    const tree = markdownTree(doc.markdown)
    for (const node of tree.children) if (node.type === 'code' && node.lang === 'typescript') {
      const source = ts.createSourceFile('contract.d.ts', node.value, ts.ScriptTarget.Latest, true)
      assert.deepEqual(source.parseDiagnostics, [], doc.id)
      assert.doesNotMatch(node.value, /declare const default\b|static\s*\{|\basync\s+\w+\(/, doc.id)
      function inspect(child: any) {
        if (ts.isMethodDeclaration(child) || ts.isFunctionDeclaration(child) || ts.isConstructorDeclaration(child)) {
          assert.equal(child.body, undefined, doc.id)
          for (const parameter of child.parameters) assert.equal(parameter.initializer, undefined, doc.id)
        }
        if (ts.isClassDeclaration(child)) for (const member of child.members) {
          if (ts.isConstructorDeclaration(member)) continue
          assert.ok(!ts.isPrivateIdentifier(member.name ?? {}), doc.id)
          assert.ok(!member.modifiers?.some((modifier: any) => modifier.kind === ts.SyntaxKind.PrivateKeyword), doc.id)
        }
        ts.forEachChild(child, inspect)
      }
      inspect(source)
    }
    for (const match of doc.markdown.matchAll(/\]\((\/guide\/[^)#]+)(?:#[^)]+)?\)/g)) {
      const candidates = (await readdir(path.join(root, 'app/[locale]/guide'), { recursive: true })).filter(file => file.endsWith('page.tsx'))
      assert.ok(candidates.some(file => '/guide/' + file.replace(/\([^/]+\)\//g, '').replace(/\/page.tsx$/, '') === match[1]), `${doc.id}: ${match[1]}`)
    }
  }
  const next = packages.find(doc => doc.id === 'packages/css-next')!
  const section = next.markdown.split('### withMasterCSS')[1].split('## @master/css-next/adapter')[0]
  assert.equal((section.match(/function withMasterCSS/g) ?? []).length, 3)
  assert.match(packages.find(doc => doc.id === 'packages/css-language-server')!.markdown, /Executable server startup entry/)
  assert.doesNotMatch(packages.find(doc => doc.id === 'packages/css-svelte-addon')!.markdown, /sv\.file|defineAddon\(/)
})
