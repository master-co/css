import { introductionContent } from '../utils/introduction-content'
import { installationGuideContent, installationGuideSlugs } from '../utils/installation-content'
import { installationGuidesMarkdown } from '../utils/installation-guides'
import { installationIllustrationMarkdown } from '../content/guide/installation/(main)/illustration'
import { compatibilityIllustrationMarkdown } from '../content/guide/compatibility/illustration'
import { deliveryFences } from '../tests/delivery-examples'
import { agentGuideContent, agentGuideSlugs, agentFixMarkdown } from '../utils/agent-content'
import { agentPromptMarkdown, previewWorkflowMarkdown } from '../utils/agent-guide-data'
import { agentOptionsMarkdown } from '../utils/agent-options'
import { agentStyleExample } from '../utils/agent-style-example'
import { toolingGuideContent, toolingGuideSlugs } from '../utils/tooling-content'
import { toolingExampleMarkdown, toolingOptionsMarkdown } from '../utils/tooling-guide-data'
import { packageTreeMarkdown } from '../utils/package-trees'
import { authoringExampleMarkdown } from '../utils/authoring-examples'
import { deliveryGuideContent, deliveryGuideSlugs } from '../utils/delivery-content'
import { deliveryFlowMarkdown } from '../utils/delivery-flows'
import { firstPaintMarkdown, resourceWaterfallsMarkdown } from '../utils/first-paint-examples'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { syntaxTutorialContent } from '../utils/syntax-tutorial'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { extractSearchNodesFromMdx } from '@master/internal-site/utils/search-pages'
import { guideOverviewMarkdown, guideOverviewSections } from '../utils/guide-overview'
import { foundationGuideContent, foundationGuideSlugs } from '../utils/foundation-content'
import { projectStyleGuideContent, projectStyleGuideSlugs } from '../utils/project-style-content'
import { migrationGuideContent, migrationGuideSlugs } from '../utils/migration-content'
import { migrationGuides } from '../utils/migration-guides'
import { migrationIllustrationMarkdown } from '../content/guide/migration/illustration'
import { documentationHygieneIssues } from '../tests/document-hygiene'
import { projectStyleExamples, projectStyleExample } from '@master/internal-site/demo/project-style-examples.ts'
import { configuredExampleCSS, configuredMarkupClasses, configuredMarkupMarkdown } from '@master/internal-site/css/configured-example.ts'
import { extractReferenceMdx, portableMarkdown } from '../reference/markdown'
import { getThemeVariables, getThemeNumericVariableEntries } from '@master/internal-site/css/theme-variables.ts'
import {
  cleanMdx,
  generate,
  loadPages,
  deriveTitle,
  metadataTitle,
  normalizeRoutePath,
  pageUrl,
  topSection,
  renderLlmsIndex,
  renderLlmsFull,
  type Page
} from './generate-llms-txt'

const fixture: Page[] = [
  {
    file: '/x/guide/content.mdx',
    section: 'guide',
    url: '/en/guide',
    title: 'Guide',
    description: 'Start using Master CSS.',
    body: '## Getting Started\nIntro.'
  },
  {
    file: '/x/guide/colors/content.mdx',
    section: 'guide',
    url: '/en/guide/colors',
    title: 'Colors',
    description: 'Create color tokens.',
    body: '# Colors\nColor system overview.'
  },
  {
    file: '/x/reference/content.mdx',
    section: 'reference',
    url: '/en/reference',
    title: 'Reference',
    description: 'API reference.',
    body: '# Reference\nAPI reference.'
  }
]

test('migration exports retain readable comparisons, complete examples and search content', async () => {
  const root = fileURLToPath(new URL('..', import.meta.url))
  const pages = await loadPages(path.join(root, 'content'))
  for (const slug of migrationGuideSlugs) {
    const content = await migrationGuideContent(root, slug)
    assert.deepEqual(content.notes, [])
    assert.equal(pages.find(page => page.url === `/en/guide/migration${slug ? `/${slug}` : ''}`)?.body, content.markdown)
    assert.doesNotMatch(content.markdown, /<\/?DocumentComparison|eslint-/)
    if (['css', 'css-in-js'].includes(slug)) assert.match(content.markdown, /export function Button/)
    if (!slug) {
      for (const guide of migrationGuides) assert.ok(content.markdown.includes(`[${guide.title}](/guide/migration/${guide.slug}) — ${guide.description}`))
      assert.doesNotMatch(content.markdown, /<MigrationGuides|<MigrationIllustration|brands\[/)
      assert.ok(content.markdown.includes(migrationIllustrationMarkdown()))
      assert.match(content.markdown, /id="custom-engine-and-binding-migration"/)
      assert.match(content.markdown, /\/reference\/packages#css\)/)
    }
    const source = await readFile(path.join(root, `content/guide/migration/${slug}/content.mdx`), 'utf8')
    for (const fence of source.matchAll(/```[\s\S]*?```/g)) {
      const dedented = fence[0].endsWith('\n    ```') ? fence[0].replace(/\n {4}/g, '\n') : fence[0]
      const normalized = dedented.replace(/<!--\s*@MARK[\s\S]*?-->/g, '')
      assert.ok(content.markdown.includes(normalized), `${slug}: complete fence`)
    }
    for (const locale of ['en', 'tw']) {
      const search = JSON.parse(await readFile(path.join(root, `public/search/${locale}.json`), 'utf8'))
      const page = search.find((entry: { url: string }) => entry.url.replace(/^\/(en|tw)(?=\/)/, '') === `/guide/migration${slug ? `/${slug}` : ''}`)
      assert.deepEqual(page.nodes, extractSearchNodesFromMdx(content.searchMarkdown))
    }
  }
})

test('project style guides retain complete configured examples in search and llms exports', async () => {
  const root = fileURLToPath(new URL('..', import.meta.url))
  const pages = await loadPages(path.join(root, 'content'))
  for (const slug of projectStyleGuideSlugs) {
    const content = await projectStyleGuideContent(root, slug)
    assert.deepEqual(content.notes, [])
    assert.equal(pages.find(page => page.url === `/en/guide/${slug}`)?.body, content.markdown)
    for (const locale of ['en', 'tw']) {
      const search = JSON.parse(await readFile(path.join(root, `public/search/${locale}.json`), 'utf8'))
      const page = search.find((entry: { url: string }) => entry.url.replace(/^\/(en|tw)(?=\/)/, '') === `/guide/${slug}`)
      assert.deepEqual(page.nodes, extractSearchNodesFromMdx(content.searchMarkdown))
    }
    const source = await readFile(path.join(root, `content/guide/${slug}/content.mdx`), 'utf8')
    for (const match of source.matchAll(/<ProjectStyleExample name="([^"]+)"/g)) {
      const example = projectStyleExample(match[1])
      assert.ok(content.markdown.includes(configuredMarkupMarkdown(example.source, example.html)), `${slug}: ${match[1]}`)
      assert.ok(content.markdown.includes(example.caption))
    }
    for (const match of source.matchAll(/<PackageTree name="([^"]+)"/g)) assert.ok(content.markdown.includes(packageTreeMarkdown(match[1])))
    for (const match of source.matchAll(/<PackageAuthoringExample part="([^"]+)"/g)) assert.ok(content.markdown.includes(authoringExampleMarkdown(match[1])))
    assert.doesNotMatch(content.markdown, /<(?:ProjectStyleExample|PackageTree|PackageAuthoringExample|DemoFeatureSupport|DemoViewTransition|CompatibilityIllustration)|MCSS_EXPRESSION/)
    for (const fence of source.matchAll(/```[\s\S]*?```/g)) {
      const authored = fence[0].replace(/<!--\s*@MARK[\s\S]*?-->/g, '')
      assert.ok(content.markdown.includes(authored), `${slug}: complete authored fence`)
    }
  }
  const compatibility = await projectStyleGuideContent(root, 'compatibility')
  assert.ok(compatibility.markdown.includes("@import 'swiper/css' layer(defaults);"))
  assert.ok(compatibility.markdown.includes('/reference/rules/declarations#vendor-prefixes'))
  assert.ok(compatibility.markdown.includes(compatibilityIllustrationMarkdown()))
  const field = compatibility.examples.find(example => example.classes.includes('(field-sizing:content)@supports(field-sizing:content)'))
  assert.ok(field, 'the native enhancement survives the portable export')
  assert.match(field.css, /@supports\s*\(field-sizing:\s*content\)/)
  assert.match(field.css, /field-sizing:\s*content/)
  assert.match(field.css, /min-height:\s*6rem/)
  assert.match(field.css, /max-height:\s*12rem/)
  const checkbox = compatibility.examples.find(example => example.classes.includes('b-blue-60:has(:checked)'))
  assert.ok(checkbox, 'the selector enhancement survives the portable export')
  assert.ok(checkbox.css.includes(':has(:checked)'))
  assert.doesNotMatch(compatibility.markdown, /```css\n\s*```/)
  const transitions = await projectStyleGuideContent(root, 'view-transitions')
  assert.ok(transitions.markdown.includes('[Interactive article transition preview](/guide/view-transitions#article-list-to-detail)'))
  assert.ok(transitions.markdown.includes('The same `view-transition-name` must be unique'))
  assert.ok(transitions.markdown.includes('## Reduced motion'))
  const theme = await projectStyleGuideContent(root, 'theme')
  assert.ok(theme.markdown.includes('--color-brand: #4f46e5'))
  for (const slug of ['cascade-layers']) {
    const source = await readFile(path.join(root, `content/guide/${slug}/content.mdx`), 'utf8')
    const content = await projectStyleGuideContent(root, slug)
    for (const anchor of source.matchAll(/<a id="([^"]+)"><\/a>/g)) assert.ok(content.markdown.includes(anchor[0]))
  }
})

test('configured recipes validate their full markup and retain actual token and layer declarations', () => {
  for (const example of Object.values(projectStyleExamples)) {
    const css = configuredExampleCSS(example.source, configuredMarkupClasses(example.html))
    assert.match(css, /@layer (?:theme|components|utilities)/)
  }
  const spacing = projectStyleExamples.spacing
  assert.match(configuredExampleCSS(spacing.source, configuredMarkupClasses(spacing.html)), /padding:var\(--spacing-card\)/)
  const layers = projectStyleExamples.layers
  const css = configuredExampleCSS(layers.source, configuredMarkupClasses(layers.html))
  assert.match(css, /@layer components\s*\{\s*\.card\s*\{/)
  assert.match(css, /--color-surface-raised:/)
  assert.match(css, /--radius-lg:/)
  assert.match(css, /@layer utilities\{/)
  assert.match(css, /\.p-sm\{padding:var\(--spacing-sm\)\}/)
  const components = projectStyleExamples.components
  const componentCSS = configuredExampleCSS(components.source, configuredMarkupClasses(components.html))
  assert.match(componentCSS, /--color-blue-60:/)
  assert.match(componentCSS, /--color-blue-70:/)
  const modes = projectStyleExamples.modes
  assert.match(configuredExampleCSS(modes.source, configuredMarkupClasses(modes.html)), /\.dark\s*\{/)
  assert.throws(() => projectStyleExample('toString'), /Unknown project style/)
})

test('direct configured demo props export literal HTML and CSS without executing JSX', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'project-style-export-'))
  try {
    const file = path.join(root, 'content.mdx')
    await writeFile(file, '<DemoConfiguredExample name="spacing" title="Padding" source="@theme { --spacing-card: 1.5rem;  }" html={\'<article class="p-card">Collection</article>\'} caption="Shared padding." />')
    const result = await extractReferenceMdx(file)
    assert.deepEqual(result.notes, [])
    assert.match(result.markdown, /<article class="p-card">Collection<\/article>/)
    assert.match(result.markdown, /padding:var\(--spacing-card\)/)
    assert.match(result.markdown, /Shared padding\./)
    await writeFile(file, '<DemoConfiguredExample source={process.exit()} html="" />')
    await assert.rejects(() => extractReferenceMdx(file), /Unsupported document expression/)
  } finally { await rm(root, { recursive: true, force: true }) }
})

test('deriveTitle prefers the first heading over the route segment', () => {
  assert.equal(deriveTitle('# Hello World\nrest', 'fallback'), 'Hello World')
  assert.equal(deriveTitle('## Subhead\nbody', 'fallback'), 'Subhead')
})

test('Guide overview keeps its category anchors and publishes the same entries to search and Markdown', async () => {
  const categories = JSON.parse(await readFile(new URL('../.categories/guide.json', import.meta.url), 'utf8'))
  const sections = guideOverviewSections(categories)
  const markdown = guideOverviewMarkdown(categories)
  const nodes = extractSearchNodesFromMdx(markdown)
  assert.deepEqual(nodes.filter(node => node.tag === 'h2').map(node => node.id), [
    'getting-started', 'agentic-workflows', 'authoring', 'fundamentals', 'design-foundations', 'build-and-delivery'
  ])
  for (const section of sections) for (const entry of section.entries) assert.ok(markdown.includes(`](${entry.url})`), entry.url)
  assert.ok(markdown.includes('<a id="syntax-tutorial"></a>'))
  assert.equal(sections[0].entries[2].url, '/guide/syntax-tutorial')
  const searchPages = JSON.parse(await readFile(new URL('../public/search/en.json', import.meta.url), 'utf8'))
  assert.deepEqual(searchPages.find((page: { url: string }) => page.url === '/guide').nodes, nodes)
  const source = await readFile(new URL('../content/guide/content.mdx', import.meta.url), 'utf8')
  assert.doesNotMatch(source + markdown, /Get ready for the journey|Try Master CSS online|Join our community|Use documentation/)
})

test('deriveTitle strips trailing [sr-only] / {.cls} markers from MDX headings', () => {
  assert.equal(deriveTitle('## Overview [sr-only]\nbody', 'fallback'), 'Overview')
  assert.equal(deriveTitle('## Overview {.sr-only}\nbody', 'fallback'), 'Overview')
})

test('deriveTitle falls back to titleized last segment when no heading', () => {
  assert.equal(deriveTitle('no headings here', 'static-rendering'), 'Static Rendering')
})

test('pageUrl strips content.mdx and prefixes locale', () => {
  assert.equal(pageUrl('guide/colors/content.mdx'), '/en/guide/colors')
  assert.equal(pageUrl('guide/content.mdx', 'tw'), '/tw/guide')
})

test('pageUrl strips Next.js route groups', () => {
  assert.equal(normalizeRoutePath('guide/installation/(main)/cdn/content.mdx'), 'guide/installation/cdn')
  assert.equal(pageUrl('guide/installation/(main)/content.mdx'), '/en/guide/installation')
  assert.equal(pageUrl('guide/installation/(main)/cdn/content.mdx'), '/en/guide/installation/cdn')
})

test('topSection extracts the first segment', () => {
  assert.equal(topSection('guide/colors/content.mdx'), 'guide')
  assert.equal(topSection('guide/installation/(main)/cdn/content.mdx'), 'guide')
  assert.equal(topSection('reference/content.mdx'), 'reference')
})

test('metadataTitle reads string and absolute metadata titles', () => {
  assert.equal(metadataTitle('Colors'), 'Colors')
  assert.equal(metadataTitle({ absolute: 'Installing Master CSS' }), 'Installing Master CSS')
  assert.equal(metadataTitle({ default: 'Master CSS' }), 'Master CSS')
})

test('cleanMdx removes MDX-only syntax outside fenced code', () => {
  const out = cleanMdx([
    "import Demo from './Demo'",
    '',
    '## Overview [sr-only]',
    '<Demo className="x">',
    '    <div className="demo">visual-only</div>',
    '    <summary>Generated CSS</summary>',
    "{require('./fixture.css?raw')}",
    'Content <Badge /> text.',
    '</Demo>',
    '',
    '```tsx',
    "import React from 'react'",
    '<Demo />',
    '```'
  ].join('\n'))
  assert.match(out, /## Overview\n/)
  assert.match(out, /Content\s+text\./)
  assert.doesNotMatch(out, /^import Demo/m)
  assert.doesNotMatch(out, /require\(/)
  assert.doesNotMatch(out, /Generated CSS/)
  assert.doesNotMatch(out, /<Badge/)
  assert.match(out, /import React from 'react'/)
  assert.match(out, /<Demo \/>/)
})

test('renderLlmsIndex emits H1 + summary + per-section H2 with links', () => {
  const out = renderLlmsIndex(fixture, 'https://example.test')
  assert.match(out, /^# Master CSS\n/)
  assert.match(out, /\n> .+\n/)
  assert.match(out, /\n## Guide\n/)
  assert.match(out, /\n## Reference\n/)
  assert.match(out, /- \[Guide\]\(https:\/\/example\.test\/en\/guide\): Start using Master CSS\./)
  assert.match(out, /- \[Colors\]\(https:\/\/example\.test\/en\/guide\/colors\): Create color tokens\./)
  assert.match(out, /- \[Reference\]\(https:\/\/example\.test\/en\/reference\): API reference\./)
})

test('renderLlmsIndex sorts sections alphabetically and pages by url', () => {
  const out = renderLlmsIndex(fixture, 'https://example.test')
  const guideIdx = out.indexOf('## Guide')
  const refIdx = out.indexOf('## Reference')
  assert.ok(guideIdx > 0 && refIdx > guideIdx)
  const colorsIdx = out.indexOf('Colors')
  const guideTopIdx = out.indexOf('](https://example.test/en/guide)')
  assert.ok(guideTopIdx > 0 && guideTopIdx < colorsIdx)
})

test('renderLlmsFull concatenates each page body with a Source line', () => {
  const out = renderLlmsFull(fixture, 'https://example.test')
  assert.match(out, /Source: https:\/\/example\.test\/en\/guide\b/)
  assert.match(out, /Summary: Start using Master CSS\./)
  assert.match(out, /Color system overview\./)
  assert.match(out, /API reference\./)
})

test('llms includes the complete tutorial and excludes retired Guide bodies', async () => {
  const root = fileURLToPath(new URL('../', import.meta.url))
  const pages = await loadPages(`${root}/content`)
  const tutorial = pages.find(page => page.url === '/en/guide/syntax-tutorial')
  assert.equal(tutorial?.body, (await syntaxTutorialContent(root)).markdown)
  assert.ok(tutorial)
  assert.match(tutorial.body, /@container card/)
  assert.ok(renderLlmsFull(pages).includes(tutorial.body))
})

test('all foundation bodies preserve generated CSS and agree with search and llms exports', async () => {
  const root = fileURLToPath(new URL('../', import.meta.url))
  const pages = await loadPages(`${root}/content`)
  const search = await Promise.all(['en', 'tw'].map(async locale => JSON.parse(await readFile(`${root}/public/search/${locale}.json`, 'utf8'))))
  for (const slug of foundationGuideSlugs) {
    const content = await foundationGuideContent(root, slug)
    assert.ok(content.markdown.length > 1000, slug)
    assert.equal(pages.find(page => page.url === `/en/guide/${slug}`)?.body, content.markdown, slug)
    for (const example of content.examples) assert.ok(content.markdown.includes(example.css), `${slug}: ${example.title}`)
    for (const index of search) {
      const page = index.find((page: { url: string }) => page.url.replace(/^\/(en|tw)(?=\/)/, '') === `/guide/${slug}`)
      assert.deepEqual(page?.nodes, extractSearchNodesFromMdx(content.searchMarkdown), slug)
    }
    assert.doesNotMatch(content.markdown, /\[object Object\]|<Foundation\w+\s*\/>|MCSS_EXPRESSION_/)
  }
  const typography = await foundationGuideContent(root, 'typography')
  assert.match(typography.markdown, /## Text treatments and font sizes/)
  assert.ok(extractSearchNodesFromMdx(typography.searchMarkdown).some(node => node.id === 'without-vs-with-text-token'))
})

test('foundation exports preserve the visual comparisons and explicit token selections in HTML', async () => {
  const { selectedSpecimensMarkdown } = await import('@master/internal-site/css/foundation-data/specimen-content.ts')
  const { paletteKeys } = await import('@master/internal-site/css/foundation-data/tokens.ts')
  const root = fileURLToPath(new URL('../', import.meta.url))
  for (const slug of foundationGuideSlugs) {
    const source = await readFile(`${root}/content/guide/${slug}/content.mdx`, 'utf8')
    const body = (await foundationGuideContent(root, slug)).markdown
    for (const match of source.matchAll(/<FoundationTokens namespace="([^"]+)" keys={([^}]+)} \/>/g)) {
      const keys = JSON.parse(match[2])
      assert.ok(body.includes(portableMarkdown(selectedSpecimensMarkdown(match[1], keys))), `${slug}: ${match[1]}`)
    }
    assert.doesNotMatch(source, /<FoundationTokens\b(?![^>]*\bkeys=)/, `${slug}: specimens require an explicit selection`)
  }
  // The complete palette and type scales live in Reference; Guide pages keep one composed comparison.
  const colors = (await foundationGuideContent(root, 'colors')).markdown
  assert.ok(!paletteKeys.every(key => colors.includes(`--color-${key}`)), 'the full palette belongs to /reference/tokens/color')
  assert.ok(colors.includes('/reference/tokens/color'))
})

test('foundation extraction fails on missing adapters and recursive includes without executing JSX', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'master-foundation-export-'))
  const directory = path.join(root, 'content/guide/typography')
  await mkdir(path.join(directory, 'components'), { recursive: true })
  try {
    await writeFile(path.join(directory, 'content.mdx'), '## Inventory\n\n<UnmappedInventory />')
    await assert.rejects(foundationGuideContent(root, 'typography'), /UnmappedInventory has no Markdown adapter/)
    await writeFile(path.join(directory, 'content.mdx'), "<Class2CSS>{(() => { throw new Error('executed JSX') })()}</Class2CSS>")
    await assert.rejects(foundationGuideContent(root, 'typography'), /Unsupported document expression: CallExpression/)
    await writeFile(path.join(directory, 'content.mdx'), "import Loop from './components/Loop.mdx'\n\n<Loop />")
    await writeFile(path.join(directory, 'components/Loop.mdx'), "import Root from '../content.mdx'\n\n<Root />")
    await assert.rejects(foundationGuideContent(root, 'typography'), /Recursive document include/)
  } finally { await rm(root, { recursive: true, force: true }) }
})

test('file trees export their authored names, order and nested hierarchy across guide adapters', async () => {
  const root = fileURLToPath(new URL('..', import.meta.url))
  const route = await deliveryGuideContent(root, 'route-level-styles')
  const authoring = await projectStyleGuideContent(root, 'authoring-packages')
  const monorepo = await projectStyleGuideContent(root, 'monorepo')
  for (const [content, tree] of [
    [route, '└── app/\n    ├── globals.css\n    └── home/\n        ├── page.tsx\n        └── home.css'],
    [authoring, '└── my-master-theme/\n    ├── package.json\n    ├── master.css\n    └── README.md'],
    [monorepo, '├── package.json\n└── styles/\n    └── shared.css'],
  ] as const) {
    assert.ok(content.markdown.includes(tree))
    assert.ok(content.searchMarkdown.includes(tree))
    assert.doesNotMatch(content.markdown, /<ExplorerView|\[object Object\]/)
  }
})

test('delivery guides retain ordered process text, complete fences and generated examples in exports', async () => {
  const root = fileURLToPath(new URL('..', import.meta.url))
  const pages = await loadPages(path.join(root, 'content'))
  for (const slug of deliveryGuideSlugs) {
    const content = await deliveryGuideContent(root, slug)
    assert.deepEqual(content.notes, [])
    assert.equal(pages.find(page => page.url === `/en/guide/${slug}`)?.body, content.markdown)
    const source = await readFile(path.join(root, `content/guide/${slug}/content.mdx`), 'utf8')
    for (const match of source.matchAll(/<DeliveryFlow name="([^"]+)"/g)) assert.ok(content.markdown.includes(deliveryFlowMarkdown(match[1])))
    for (const fence of source.matchAll(/```[\s\S]*?```/g)) {
      const dedented = fence[0].endsWith('\n    ```') ? fence[0].replace(/\n {4}/g, '\n') : fence[0]
      const normalized = dedented.replace(/<!--\s*@MARK[\s\S]*?-->/g, '')
      assert.ok(content.markdown.includes(normalized), `${slug}: complete fence`)
    }
    if (source.includes('<ResourceWaterfall')) assert.ok(content.markdown.includes(resourceWaterfallsMarkdown()))
    if (source.includes('<FirstPaintComparison')) assert.ok(content.markdown.includes(firstPaintMarkdown()))
    assert.doesNotMatch(content.markdown, /<(?:DeliveryFlow|ResourceWaterfall|FirstPaintComparison|Step|Class2CSS|ConfiguredExample)|MCSS_EXPRESSION/)
    for (const locale of ['en', 'tw']) {
      const search = JSON.parse(await readFile(path.join(root, `public/search/${locale}.json`), 'utf8'))
      const page = search.find((entry: { url: string }) => entry.url.replace(/^\/(en|tw)(?=\/)/, '') === `/guide/${slug}`)
      assert.deepEqual(page.nodes, extractSearchNodesFromMdx(content.searchMarkdown))
    }
  }
})

test('tooling guides retain every option, diagnostic and source/result pair in search and portable output', async () => {
  const root = fileURLToPath(new URL('..', import.meta.url))
  const pages = await loadPages(path.join(root, 'content'))
  for (const slug of toolingGuideSlugs) {
    const content = await toolingGuideContent(root, slug)
    assert.deepEqual(content.notes, [])
    assert.equal(pages.find(page => page.url === `/en/guide/${slug}`)?.body, content.markdown)
    const source = await readFile(path.join(root, `content/guide/${slug}/content.mdx`), 'utf8')
    for (const match of source.matchAll(/<ToolingOptions name="([^"]+)"/g)) assert.ok(content.markdown.includes(toolingOptionsMarkdown(match[1])))
    for (const match of source.matchAll(/<ToolingExample name="([^"]+)"/g)) assert.ok(content.markdown.includes(toolingExampleMarkdown(match[1])))
    for (const fence of source.matchAll(/```[\s\S]*?```/g)) assert.ok(content.markdown.includes(fence[0]), `${slug}: complete authored fence`)
    assert.doesNotMatch(content.markdown, /<(?:ToolingOptions|ToolingExample|DocumentComparison)|MCSS_EXPRESSION/)
    for (const locale of ['en', 'tw']) {
      const search = JSON.parse(await readFile(path.join(root, `public/search/${locale}.json`), 'utf8'))
      const page = search.find((entry: { url: string }) => entry.url.replace(/^\/(en|tw)(?=\/)/, '') === `/guide/${slug}`)
      assert.deepEqual(page.nodes, extractSearchNodesFromMdx(content.searchMarkdown))
    }
  }
})

test('current public documents keep historical teaching in Migration Guide', async () => {
  const root = fileURLToPath(new URL('..', import.meta.url))
  const pages = await loadPages(path.join(root, 'content'))
  const failures: string[] = []
  for (const page of pages) {
    const url = page.url.replace(/^\/(en|tw)(?=\/)/, '')
    if (/^\/guide\/migration(?:\/|$)/.test(url)) continue
    const navigation = ['/guide', '/reference'].includes(url)
    failures.push(...documentationHygieneIssues(page.body, navigation, url === '/guide/ai-coding#connect-the-mcp-server').map(issue => `${url}: ${issue}`))
  }
  const { default: glob } = await import('fast-glob')
  const files = await glob(['packages/*/README*', 'examples/**/README*', 'site/README.md'], { cwd: path.dirname(root), ignore: ['**/node_modules/**', '**/vendor/**'] })
  for (const file of files) failures.push(...documentationHygieneIssues(await readFile(path.join(root, '..', file), 'utf8'), false, file === 'packages/mcp/README.md').map(issue => `${file}: ${issue}`))
  assert.deepEqual(failures, [])
})

test('hygiene distinguishes current diffs and native CSS from migration teaching', () => {
  const current = 'Classes removed from the DOM release their usage counts.\n\nCompare before/after CSS.\n\n```css\n@page { size: A4; }\n```\n\n| Prompt | Use |\n| --- | --- |\n| `migrate-to-mastercss` | Plan external-system conversion. |'
  assert.deepEqual(documentationHygieneIssues(current, false, true), [])
  assert.ok(documentationHygieneIssues('| Prompt | Use |\n| --- | --- |\n| `migrate-to-mastercss` | Convert Tailwind CSS to Master CSS. |').length)
  for (const historical of ['`@theme dark` is removed.', '| Previous name | Replacement |', 'Follow [Migration](/guide/migration/v2-rc).', 'Migrate a Tailwind CSS project in these steps.', 'Convert Tailwind CSS classes to Master CSS.', 'Replace Sass with Master CSS.', 'Convert existing CSS to Master CSS.', 'Tailwind CSS to current Master CSS conversion tutorial.', 'Use `$name` or `base-unit`.']) {
    assert.ok(documentationHygieneIssues(historical).length, historical)
  }
  for (const command of ['master-css migrate src --from rc-legacy', 'Convert Tailwind CSS classes to Master CSS.']) {
    assert.ok(documentationHygieneIssues(`\`\`\`text\n${command}\n\`\`\``).length, command)
  }
})

test('agent guides export complete prompts, tool catalogs, preview workflow and native examples', async () => {
  const root = fileURLToPath(new URL('..', import.meta.url))
  const pages = await loadPages(path.join(root, 'content'))
  for (const slug of agentGuideSlugs) {
    const content = await agentGuideContent(root, slug)
    assert.deepEqual(content.notes, [])
    assert.equal(pages.find(page => page.url === `/en/guide/${slug}`)?.body, content.markdown)
    const source = await readFile(path.join(root, `content/guide/${slug}/content.mdx`), 'utf8')
    for (const match of source.matchAll(/<AgentPrompt name="([^"]+)"/g)) assert.ok(content.markdown.includes(agentPromptMarkdown(match[1])))
    for (const match of source.matchAll(/<AgentOptions name="([^"]+)"/g)) assert.ok(content.markdown.includes(agentOptionsMarkdown(match[1])))
    if (source.includes('<AgentWorkflow')) assert.ok(content.markdown.includes(previewWorkflowMarkdown()))
    if (source.includes('<AgentFixExample')) assert.ok(content.markdown.includes(agentFixMarkdown()))
    if (source.includes('<AgentStyleExample')) {
      assert.ok(content.markdown.includes(agentStyleExample.source))
      assert.ok(content.markdown.includes(agentStyleExample.html))
      assert.ok(content.markdown.includes(agentStyleExample.caption))
    }
    for (const fence of source.matchAll(/```[\s\S]*?```/g)) assert.ok(content.markdown.includes(fence[0]), `${slug}: complete authored fence`)
    assert.doesNotMatch(content.markdown, /<(?:AgentPrompt|AgentOptions|AgentWorkflow|AgentFixExample|AgentStyleExample)|MCSS_EXPRESSION/)
    for (const locale of ['en', 'tw']) {
      const search = JSON.parse(await readFile(path.join(root, `public/search/${locale}.json`), 'utf8'))
      const page = search.find((entry: { url: string }) => entry.url.replace(/^\/(en|tw)(?=\/)/, '') === `/guide/${slug}`)
      assert.deepEqual(page.nodes, extractSearchNodesFromMdx(content.searchMarkdown))
    }
  }
})

test('tool catalogs export source links and basic usage in both locales', async () => {
  const root = fileURLToPath(new URL('..', import.meta.url))
  const { renderDocumentMarkdown } = await import('../reference/build')
  const catalog = JSON.parse(await readFile(path.join(root, '.generated/reference.json'), 'utf8'))
  const docs = catalog.documents.filter((doc: any) => doc.kind === 'tool')
  assert.deepEqual(docs.map((doc: any) => doc.id).sort(), ['tools/cli', 'tools/mcp'])
  for (const locale of ['en', 'tw']) {
    const search = JSON.parse(await readFile(path.join(root, `public/search/${locale}.json`), 'utf8'))
    for (const doc of docs) {
      const exported = await readFile(path.join(root, `public/${locale === 'en' ? '' : 'tw/'}reference/${doc.id}.md`), 'utf8')
      const body = renderDocumentMarkdown(doc, catalog)
      const llms = renderLlmsFull([{ file: doc.source, section: 'reference', url: doc.url, title: doc.title, body }], 'https://example.test')
      for (const fence of doc.markdown.matchAll(/```[\s\S]*?```/g)) {
        assert.ok(llms.includes(fence[0]), `${locale}: ${doc.id} llms fence`)
        assert.ok(exported.includes(fence[0]), `${locale}: ${doc.id} markdown fence`)
      }
      const indexed = search.find((page: any) => page.url.replace(/^\/(en|tw)(?=\/)/, '') === doc.url)
      assert.ok(indexed, doc.id)
      assert.doesNotMatch(body, /<(?:DocumentParameters|DocumentDisclosure)/)
    }
  }
})


test('package catalog retains import guidance and source destinations in portable output', async () => {
  const root = fileURLToPath(new URL('..', import.meta.url))
  const { renderDocumentMarkdown } = await import('../reference/build')
  const catalog = JSON.parse(await readFile(path.join(root, '.generated/reference.json'), 'utf8'))
  const docs = catalog.documents.filter((doc: any) => doc.kind === 'package')
  assert.equal(docs.length, 1)
  for (const locale of ['en', 'tw']) {
    const search = JSON.parse(await readFile(path.join(root, `public/search/${locale}.json`), 'utf8'))
    for (const doc of docs) {
      const exported = await readFile(path.join(root, `public/${locale === 'en' ? '' : 'tw/'}reference/${doc.id}.md`), 'utf8')
      const body = renderDocumentMarkdown(doc, catalog)
      const llms = renderLlmsFull([{ file: doc.source, section: 'reference', url: doc.url, title: doc.title, body }], 'https://example.test')
      for (const fence of doc.markdown.matchAll(/```[\s\S]*?```/g)) {
        assert.ok(exported.includes(fence[0]), `${locale}: ${doc.id} markdown declaration`)
        assert.ok(llms.includes(fence[0]), `${locale}: ${doc.id} llms declaration`)
      }
      for (const heading of doc.headings) {
        const explicit = doc.markdown.includes(`{#${heading.id}}`)
        assert.ok(exported.includes(explicit ? `id="${heading.id}"` : `## ${heading.title}\n`), `${locale}: ${doc.id}#${heading.id}`)
      }
      const indexed = search.find((page: any) => page.url.replace(/^\/(en|tw)(?=\/)/, '') === doc.url)
      assert.deepEqual(indexed.nodes, extractSearchNodesFromMdx(doc.markdown))
      assert.doesNotMatch(body, /<(?:DocumentAPIIndex|DocumentDeclaration|DocumentDisclosure)|MCSS_EXPRESSION/)
      assert.ok(body.includes('| Import path | Purpose |'))
    }
  }
})

test('directive references export every native CSS example and setting to both locales and search', async () => {
  const root = fileURLToPath(new URL('..', import.meta.url))
  const { renderDocumentMarkdown } = await import('../reference/build')
  const catalog = JSON.parse(await readFile(path.join(root, '.generated/reference.json'), 'utf8'))
  const docs = catalog.documents.filter((doc: any) => doc.kind === 'directive')
  assert.deepEqual(docs.map((doc: any) => doc.id), [
    'directives/imports', 'directives/theme', 'directives/queries',
    'directives/definitions', 'directives/scanning', 'directives/pruning'
  ])
  for (const locale of ['en', 'tw']) {
    const search = JSON.parse(await readFile(path.join(root, `public/search/${locale}.json`), 'utf8'))
    for (const doc of docs) {
      const exported = await readFile(path.join(root, `public/${locale === 'en' ? '' : 'tw/'}reference/${doc.id}.md`), 'utf8')
      const body = renderDocumentMarkdown(doc, catalog)
      const llms = renderLlmsFull([{ file: doc.source, section: 'reference', url: doc.url, title: doc.title, body }], 'https://example.test')
      for (const fence of doc.markdown.matchAll(/```[\s\S]*?```/g)) {
        assert.ok(exported.includes(fence[0]), `${locale}: ${doc.id} markdown fence`)
        assert.ok(llms.includes(fence[0]), `${locale}: ${doc.id} llms fence`)
      }
      const indexed = search.find((page: any) => page.url.replace(/^\/(en|tw)(?=\/)/, '') === doc.url)
      assert.deepEqual(indexed.nodes, extractSearchNodesFromMdx(doc.markdown))
      assert.doesNotMatch(body, /<StylesheetExample|MCSS_EXPRESSION/)
    }
  }
})


test('installation steps retain complete commands, stable headings and navigation in portable output', async () => {
  const root = fileURLToPath(new URL('..', import.meta.url))
  const previous = JSON.parse(await readFile(path.join(root, 'tests/installation-heading-ids.json'), 'utf8'))
  for (const slug of installationGuideSlugs) {
    const content = await installationGuideContent(root, slug)
    for (const output of [content.markdown, content.searchMarkdown]) {
      assert.doesNotMatch(output, /IntegrationCover|cover-(?:light|dark)\.webp/)
    }
    if (slug === 'astro') {
      for (const output of [content.markdown, content.searchMarkdown]) {
        assert.doesNotMatch(output, /IntegrationCover|Master CSS × Astro|cover-(?:light|dark)\.webp/)
        assert.match(output, /Connect Master CSS to an Astro site/)
      }
    }
    if (slug === 'angular') {
      assert.ok(content.examples.some(example => example.classes.includes('p-md') && /padding:\s*var\(--spacing-md\)/.test(example.css)))
    }
    const sourcePath = slug || '(main)'
    const source = await readFile(path.join(root, `content/guide/installation/${sourcePath}/content.mdx`), 'utf8')
    const normalizeFence = (value: string) => value.replace(/<!--\s*@MARK[\s\S]*?-->/g, '').split('\n').map(line => line.trim()).join('\n').trim()
    const exportedFences = deliveryFences(content.markdown).map(fence => normalizeFence(fence.text))
    for (const fence of deliveryFences(source)) assert.ok(exportedFences.includes(normalizeFence(fence.text)), `${slug}: ${fence.name}`)
    for (const match of source.matchAll(/<DeliveryFlow name="([^"]+)"/g)) assert.ok(content.markdown.includes(deliveryFlowMarkdown(match[1])))
    assert.doesNotMatch(content.markdown, /<(?:Step(?:Section|L|R|Num|End)?\b|DocumentChoice|InstallationGuides|InstallationIllustration|DemoConfiguredExample|DeliveryFlow)|MCSS_EXPRESSION/)
    if (!slug) {
      assert.ok(content.markdown.includes(installationIllustrationMarkdown()))
      const example = content.examples.find(example => example.classes.includes('p-md'))
      assert.ok(example, 'the quick-start preview retains its compiled source')
      assert.match(example.css, /\.p-md\s*\{\s*padding:\s*var\(--spacing-md\)/)
      assert.match(example.css, /--spacing-md:\s*1rem/)
    }
    if (!slug) {
      assert.ok(content.markdown.includes(installationGuidesMarkdown()))
      for (const id of ['integrations', 'cdn', 'cli']) assert.ok(content.markdown.includes(`id="${id}"`))
    }
    const url = `/guide/installation${slug ? `/${slug}` : ''}`
    for (const heading of previous[url]) {
      const explicit = source.includes(`{#${heading.id}`)
      if (explicit) assert.ok(content.markdown.includes(`id="${heading.id}"`), `${slug}: ${heading.id}`)
    }
    for (const locale of ['en', 'tw']) {
      const search = JSON.parse(await readFile(path.join(root, `public/search/${locale}.json`), 'utf8'))
      assert.ok(!search.some((entry: { url: string }) => /\/guide\/installation\/(integrations|cdn|cli)$/.test(entry.url)))
      const page = search.find((entry: { url: string }) => entry.url.replace(/^\/(en|tw)(?=\/)/, '') === url)
      assert.deepEqual(page.nodes, extractSearchNodesFromMdx(content.searchMarkdown))
    }
  }
})


test('literal document navigation exports text and rejects executable attributes', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'master-doc-choices-'))
  const file = path.join(root, 'content.mdx')
  try {
    await writeFile(file, '<DocumentOptionList label="Interfaces">\n\n<DocumentOptionEntry name="DemoSurface">\n\n**Interface:** `className`, `style`.\n\nNo implicit layout or padding. [Example](#surface).\n\n</DocumentOptionEntry>\n\n</DocumentOptionList>')
    assert.equal((await extractReferenceMdx(file)).markdown, '**`DemoSurface`**\n\n**Interface:** `className`, `style`.\n\nNo implicit layout or padding. [Example](#surface).')
    await writeFile(file, '<DocumentOptionEntry name={getName()}>Text</DocumentOptionEntry>')
    await assert.rejects(() => extractReferenceMdx(file), /DocumentOptionEntry requires a literal name/)
    await writeFile(file, `<DocumentChoices label="Next" entries={[{ title: 'Vite', href: '/guide/installation/vite', description: 'Connect the stylesheet.' }]} />`)
    assert.equal((await extractReferenceMdx(file)).markdown, '- [Vite](/guide/installation/vite) — Connect the stylesheet.')
    await writeFile(file, `<DocumentChoices label="Next" entries={(() => { throw new Error('must not execute') })()} />`)
    await assert.rejects(() => extractReferenceMdx(file), /Unsupported document expression: CallExpression/)
    await writeFile(file, `<DocumentChoices label="Next" entries={[{ ...links }]} />`)
    await assert.rejects(() => extractReferenceMdx(file), /Only literal document properties/)
    await writeFile(file, `<DemoIndex label="Catalog" groups={[{ title: 'Basics', links: [{ label: 'Foundations', href: '#foundations' }] }]} />`)
    assert.equal((await extractReferenceMdx(file)).markdown, '**Basics**\n\n- [Foundations](#foundations)')
    await writeFile(file, `<DemoIndex label="Catalog" groups={[{ title: 'Basics', links: [{ label: 'Missing destination' }] }]} />`)
    await assert.rejects(() => extractReferenceMdx(file), /DemoIndex requires literal/)
    await writeFile(file, `<DemoIndex label="Catalog" groups={buildNavigation()} />`)
    await assert.rejects(() => extractReferenceMdx(file), /Unsupported document expression: CallExpression/)
  } finally { await rm(root, { recursive: true, force: true }) }
})


test('introduction retains its panel, class mapping and shared token in portable and search output', async () => {
  const root = fileURLToPath(new URL('../', import.meta.url))
  const content = await introductionContent(root)
  const pages = await loadPages(path.join(root, 'content'))
  assert.equal(pages.find(page => page.url === '/en/guide/introduction')?.body, content.markdown)
  const overview = await extractReferenceMdx(path.join(root, 'content/guide/introduction/components/Overview.mdx'), [], [], { overview: 'include' })
  assert.deepEqual(overview.notes, [])
  assert.ok(content.markdown.includes(overview.markdown.trim()), 'the complete current preview, source and generated CSS survive the include')
  for (const text of ["@import '@master/css';", 'A class selects the style; a token supplies the value', 'The preset defines --spacing-lg as 1.5rem.', '/guide/reusing-styles']) assert.ok(content.markdown.includes(text), text)
  const spacing = content.examples.find(example => example.classes.length === 1 && example.classes[0] === 'p-lg')
  assert.ok(spacing, 'the illustrated class has actual generated output')
  assert.match(spacing.css, /--spacing-lg:\s*1\.5rem/)
  assert.match(spacing.css, /\.p-lg\s*\{\s*padding:\s*var\(--spacing-lg\)/)
  const example = content.examples.find(example => example.classes.includes('bg-brand'))
  assert.ok(example, 'the shared-token example survives the Introduction export')
  assert.match(example.css, /--color-brand:\s*#2563eb/)
  assert.match(example.css, /\.bg-brand\s*\{\s*background-color:\s*var\(--color-brand\)/)
  const changed = configuredExampleCSS(example.configuration!.replace('#2563eb', '#4f46e5'), example.classes)
  assert.match(changed, /--color-brand:\s*#4f46e5/)
  assert.match(changed, /\.bg-brand\s*\{\s*background-color:\s*var\(--color-brand\)/)
  assert.doesNotMatch(content.markdown, /<Overview|<IntroductionIllustration|<ConfiguredExample|<DemoConfiguredExample|MCSS_EXPRESSION/)
  for (const locale of ['en', 'tw']) {
    const search = JSON.parse(await readFile(path.join(root, `public/search/${locale}.json`), 'utf8'))
    const page = search.find((entry: { url: string }) => entry.url.replace(/^\/(en|tw)(?=\/)/, '') === '/guide/introduction')
    assert.deepEqual(page.nodes, extractSearchNodesFromMdx(content.searchMarkdown))
  }
})

test('benchmarks export the same chart values and complete tables as the page', async () => {
  const { benchmarkContent, benchmarkContentComponents, benchmarkLabel, benchmarkMarkdown } = await import('../utils/benchmark-content')
  const root = fileURLToPath(new URL('../', import.meta.url))
  const content = await benchmarkContent(root)
  const pages = await loadPages(path.join(root, 'content'))
  assert.equal(pages.find(page => page.url === '/en/benchmarks')?.body, content.markdown)
  const snapshot = JSON.parse(await readFile(path.join(root, '../benchmarks/docs-page-css-size/snapshot.json'), 'utf8'))
  for (const page of snapshot.pages) {
    assert.ok(content.markdown.includes(`| ${page.name} | ${(page.css.total.rawBytes / 1000).toFixed(1)} kB | ${(page.css.total.brotliBytes / 1000).toFixed(1)} kB |`), page.name)
  }
  const mdx = await readFile(path.join(root, 'content/benchmarks/content.mdx'), 'utf8')
  for (const [name, chart] of Object.entries(benchmarkContentComponents)) {
    assert.ok(mdx.includes(`<BenchmarkChart chart={${name}} />`), `${name} is on the page`)
    const rendered = benchmarkMarkdown(chart)
    assert.ok(rendered.includes('|'), name)
    assert.ok(content.markdown.includes(rendered.trim().replace(/\n{3,}/g, '\n\n')), name)
  }
  for (const text of ['Complete interaction cost data', 'Same UI, generated CSS', 'It does not measure an individual input delay or Web Vitals INP', 'Session elapsed', 'one measured run']) assert.ok(content.markdown.includes(text), text)
  assert.doesNotMatch(content.markdown, /<Benchmark|<StaticCSS|\[object Object\]|MCSS_EXPRESSION/)
  for (const locale of ['en', 'tw']) {
    const search = JSON.parse(await readFile(path.join(root, `public/search/${locale}.json`), 'utf8'))
    const page = search.find((entry: { url: string }) => entry.url.replace(/^\/(en|tw)(?=\/)/, '') === '/benchmarks')
    assert.deepEqual(page.nodes, extractSearchNodesFromMdx(content.searchMarkdown))
  }
  assert.equal(benchmarkLabel(['Fixture ', 'A']), 'Fixture A')
  assert.match(benchmarkMarkdown({ kind: 'bars', items: [{ id: 'zero', label: 'Fixture', labelNote: ' A', value: 0 }], unit: 'ms' }), /Fixture A \| 0 ms/)
  assert.throws(() => benchmarkMarkdown({ kind: 'unknown' } as any), /Unregistered benchmark presentation/)
})

test('delivery payload charts count complete responses once and omit absent assets', async () => {
  const { MasterDeliveryPayloadChart: chart, MasterDeliveryModesTables } = await import('../content/benchmarks/components/MasterDeliveryModesBenchmark')
  const { benchmarkMarkdown } = await import('../utils/benchmark-content')
  const items = chart.items
  // Independently checked against the committed docs fixture's Brotli response bodies:
  // HTML embeds CSS/hydration; progressive startup does not fetch the runtime program.
  const expected = [
    { label: 'Master CSS static', bytes: 3886, parts: ['HTML', 'External CSS'] },
    { label: 'Master CSS runtime', bytes: 50903, parts: ['HTML', 'Runtime JS', 'Runtime program'] },
    { label: 'Master CSS progressive', bytes: 36743, parts: ['HTML', 'Runtime JS'] },
    { label: 'Tailwind CSS static', bytes: 4521, parts: ['HTML', 'External CSS'] },
  ]
  assert.equal(items.length, expected.length)
  assert.equal(chart.max, 50903, 'all rows use the largest complete-response total as their scale')
  for (const [index, row] of expected.entries()) {
    assert.equal(items[index].label, row.label)
    assert.equal(items[index].total, row.bytes)
    assert.deepEqual(items[index].segments.map(segment => segment.label), row.parts)
    assert.equal(items[index].segments.reduce((sum, segment) => sum + segment.value, 0), row.bytes)
  }
  const table = benchmarkMarkdown(MasterDeliveryModesTables)
  assert.match(table, /Response assets.*Inline CSS \(in HTML\).*Runtime program.*Hydration \(in HTML\)/)
  assert.match(table, /Docs \| Master CSS progressive \| 36\.7 kB/)
  assert.match(benchmarkMarkdown(chart), /Master CSS runtime\*\* · 50\.9 kB/)
  assert.match(benchmarkMarkdown(chart), /Master CSS progressive\*\* · 36\.7 kB/)
})

test('additional article figures retain their complete lesson in Markdown and both search indexes', async () => {
  const { detailIllustrations } = await import('../reference/detail-illustrations')
  const { generateReference } = await import('../reference/build')
  const root = fileURLToPath(new URL('..', import.meta.url))
  const pages = await loadPages(path.join(root, 'content'))
  const catalog = await generateReference(root)
  const documents = [
    ...pages.map(page => ({ url: page.url.replace(/^\/en(?=\/)/, ''), markdown: page.body })),
    ...catalog.documents
  ]
  for (const locale of ['en', 'tw']) {
    const search = JSON.parse(await readFile(path.join(root, `public/search/${locale}.json`), 'utf8'))
    for (const [id, figure] of Object.entries(detailIllustrations)) {
      const document = documents.find(doc => doc.markdown.includes(`**${figure.title}**`))
      assert.ok(document, `${id}: portable article`)
      const entry = search.find((entry: { url: string }) => entry.url.replace(/^\/(en|tw)(?=\/)/, '') === document.url)
      assert.ok(entry, `${locale}/${id}: searchable article`)
      const text = entry.nodes.map((node: { text: string }) => node.text).join('\n')
      for (const paragraph of [figure.caption, ...figure.description]) {
        assert.ok(document.markdown.includes(paragraph), `${id}: complete Markdown explanation`)
        assert.ok(text.includes(paragraph), `${locale}/${id}: complete search explanation`)
      }
    }
  }
})

test('all Guide studies retain their full lesson in search and Markdown', async () => {
  const { guideStudies, guideStudyMarkdown } = await import('../content/guide/studies')
  const root = fileURLToPath(new URL('..', import.meta.url))
  const pages = await loadPages(path.join(root, 'content'))
  const search = JSON.parse(await readFile(path.join(root, 'public/search/en.json'), 'utf8'))
  for (const [id, figure] of Object.entries(guideStudies)) {
    const page = pages.find(page => page.url.startsWith('/en/guide/') && page.body.includes(guideStudyMarkdown(id)))
    assert.ok(page, `${id}: portable lesson`)
    const entry = search.find((entry: { url: string }) => entry.url.replace(/^\/(en|tw)(?=\/)/, '') === page.url.replace(/^\/(en|tw)(?=\/)/, ''))
    assert.ok(entry, `${id}: searchable page`)
    assert.ok(entry.nodes.some((node: { text: string }) => node.text.includes(figure.alt)), `${id}: full description in search`)
    assert.doesNotMatch(page.body, /<GuideStudy\b/)
  }
  assert.throws(() => guideStudyMarkdown('missing-study'), /Unknown Guide study/)
})


test('View transitions retains its five figure lessons and native CSS recipes in portable output', async () => {
  const { transitionIllustration, transitionStudies } = await import('../content/guide/view-transitions/illustration')
  const root = fileURLToPath(new URL('..', import.meta.url))
  const content = await projectStyleGuideContent(root, 'view-transitions')
  for (const figure of [transitionIllustration, ...Object.values(transitionStudies)]) {
    assert.ok(content.markdown.includes(figure.title), figure.title)
    assert.ok(content.markdown.includes(figure.caption), figure.caption)
    for (const step of figure.description) {
      assert.ok(content.markdown.includes(step.text), `${figure.title}: portable explanation`)
      assert.ok(content.searchMarkdown.includes(step.text), `${figure.title}: search explanation`)
    }
  }
  assert.match(content.markdown, /@view-transition\s*\{\s*navigation: auto/)
  assert.match(content.markdown, /navigation: none/)
  assert.match(content.markdown, /await transition\.updateCallbackDone/)
  assert.match(content.markdown, /image\.style\.viewTransitionName/)
  assert.doesNotMatch(content.markdown, /<TransitionIllustration\b/)
})


test('delivery optimization figures and runnable files survive search and portable export', async () => {
  const root = fileURLToPath(new URL('..', import.meta.url))
  const content = await deliveryGuideContent(root, 'optimizing-css-delivery')
  const { deliveryIllustrations, deliveryIllustrationMarkdown } = await import('../content/guide/optimizing-css-delivery/illustrations')
  for (const id of Object.keys(deliveryIllustrations)) {
    assert.ok(content.markdown.includes(deliveryIllustrationMarkdown(id)))
    assert.ok(content.searchMarkdown.includes(deliveryIllustrationMarkdown(id)))
  }
  for (const name of ['package.json', 'vite.config.js', 'index.html', 'reports/index.html', 'src/main.js', 'src/style.css', 'src/reports.js', 'src/reports.css']) {
    const file = await readFile(path.join(root, '../tests/fixtures/css-delivery', name), 'utf8')
    assert.ok(content.markdown.includes(file.trim()), `complete reproducible file: ${name}`)
  }
  assert.ok(content.markdown.includes('without a usage set for pruning'))
  assert.doesNotMatch(content.markdown, /<DeliveryIllustration|<DocumentDisclosure|\[object Object\]/)
})


test('Guide ownership keeps authoring discoverable and pruning at one workflow owner', async () => {
  const root = fileURLToPath(new URL('..', import.meta.url))
  const categories = JSON.parse(await readFile(path.join(root, '.categories/guide.json'), 'utf8'))
  const sections = guideOverviewSections(categories)
  const authoring = sections.find(section => section.id === 'authoring')!
  const ordered = authoring.entries.map(entry => entry.url)
  const expected = ['theme', 'global-styles', 'reusing-styles', 'route-level-styles', 'scanning-and-pruning', 'authoring-packages', 'code-linting']
  assert.deepEqual(ordered, expected.map(slug => `/guide/${slug}`))
  assert.equal(authoring.entries.find(entry => entry.url.endsWith('/scanning-and-pruning'))?.title, 'Scanning class names')
  const build = sections.find(section => section.id === 'build-and-delivery')!
  assert.deepEqual(build.entries.map(entry => entry.url), ['/guide/optimizing-css-delivery'])
  const scanning = await deliveryGuideContent(root, 'scanning-and-pruning')
  const delivery = await deliveryGuideContent(root, 'optimizing-css-delivery')
  for (const [oldAnchor, target] of [
    ['prune-native-css', 'native-pruning'],
    ['preserve-native-css', 'keep-external-and-uncertain-sources-safe'],
    ['verify-pruning', 'verify-the-pruning-step-independently']
  ]) {
    assert.ok(scanning.markdown.includes(`id="${oldAnchor}"`), oldAnchor)
    assert.ok(scanning.markdown.includes(`/guide/optimizing-css-delivery#${target}`), target)
  }
  for (const format of ['markdown', 'searchMarkdown'] as const) {
    assert.ok(scanning[format].includes('@source "../shared/**/*.tsx";'))
    assert.ok(scanning[format].includes('@safelist "bg-red-60" "bg-green-60";'))
    assert.ok(scanning[format].includes('not a ban on dynamic utilities'))
    assert.ok(delivery[format].includes('Native pruning leaves classless rules available'))
    assert.ok(delivery[format].includes('@preserve native;'))
    assert.ok(delivery[format].includes('npx master-css generate'))
    assert.ok(!scanning[format].includes('npx master-css generate'))
    assert.ok(!scanning[format].includes('Native pruning leaves classless rules available'))
  }
})
