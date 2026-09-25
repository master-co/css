import { getFontWeightRows } from '../app/[locale]/guide/typography/components/font-weight-data'
import { introductionContent } from '../utils/introduction-content'
import { brandContent } from '../utils/brand-content'
import { installationGuideContent, installationGuideSlugs } from '../utils/installation-content'
import { installationGuidesMarkdown } from '../utils/installation-guides'
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
import { legacySyntaxPages } from '../utils/legacy-syntax'
import { syntaxTutorialContent } from '../utils/syntax-tutorial'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { extractSearchNodesFromMdx } from '~/site/docs-shell/utils/search-pages'
import { guideOverviewMarkdown, guideOverviewSections } from '../utils/guide-overview'
import { foundationGuideContent, foundationGuideSlugs } from '../utils/foundation-content'
import { projectStyleGuideContent, projectStyleGuideSlugs } from '../utils/project-style-content'
import { migrationGuideContent, migrationGuideSlugs } from '../utils/migration-content'
import { migrationGuides } from '../utils/migration-guides'
import { projectStyleExamples, projectStyleExample } from '../components/demo/project-style-examples'
import { configuredExampleCSS, configuredMarkupClasses, configuredMarkupMarkdown } from '../reference/configured-example'
import { extractReferenceMdx, portableMarkdown } from '../reference/markdown'
import { getThemeVariables, getThemeNumericVariableEntries } from '../utils/theme-variables'
import { getAnimationRows } from '../app/[locale]/guide/motion/components/animation-data'
import { getDurationRows } from '../app/[locale]/guide/motion/components/duration-data'
import { getEasingRows } from '../app/[locale]/guide/motion/components/easing-data'
import { rowsByGroup, rowDescriptionByGroup } from '../app/[locale]/guide/colors/components/color-data'
import {
  cleanMdx,
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
  const pages = await loadPages(path.join(root, 'app/[locale]'))
  for (const slug of migrationGuideSlugs) {
    const content = await migrationGuideContent(root, slug)
    assert.deepEqual(content.notes, [])
    assert.equal(pages.find(page => page.url === `/en/guide/migration${slug ? `/${slug}` : ''}`)?.body, content.markdown)
    assert.doesNotMatch(content.markdown, /<\/?DocumentComparison|eslint-/)
    if (['css', 'css-in-js'].includes(slug)) assert.match(content.markdown, /export function Button/)
    if (!slug) {
      for (const guide of migrationGuides) assert.ok(content.markdown.includes(`[${guide.title}](/guide/migration/${guide.slug}) — ${guide.description}`))
      assert.doesNotMatch(content.markdown, /<MigrationGuides|brands\[/)
      assert.match(content.markdown, /function wrapEngine/)
    }
    const source = await readFile(path.join(root, `app/[locale]/guide/migration/${slug}/content.mdx`), 'utf8')
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
  const pages = await loadPages(path.join(root, 'app/[locale]'))
  for (const slug of projectStyleGuideSlugs) {
    const content = await projectStyleGuideContent(root, slug)
    assert.deepEqual(content.notes, [])
    assert.equal(pages.find(page => page.url === `/en/guide/${slug}`)?.body, content.markdown)
    for (const locale of ['en', 'tw']) {
      const search = JSON.parse(await readFile(path.join(root, `public/search/${locale}.json`), 'utf8'))
      const page = search.find((entry: { url: string }) => entry.url.replace(/^\/(en|tw)(?=\/)/, '') === `/guide/${slug}`)
      assert.deepEqual(page.nodes, extractSearchNodesFromMdx(content.searchMarkdown))
    }
    const source = await readFile(path.join(root, `app/[locale]/guide/${slug}/content.mdx`), 'utf8')
    for (const match of source.matchAll(/<ProjectStyleExample name="([^"]+)"/g)) {
      const example = projectStyleExample(match[1])
      assert.ok(content.markdown.includes(configuredMarkupMarkdown(example.source, example.html)), `${slug}: ${match[1]}`)
      assert.ok(content.markdown.includes(example.caption))
    }
    for (const match of source.matchAll(/<PackageTree name="([^"]+)"/g)) assert.ok(content.markdown.includes(packageTreeMarkdown(match[1])))
    for (const match of source.matchAll(/<PackageAuthoringExample part="([^"]+)"/g)) assert.ok(content.markdown.includes(authoringExampleMarkdown(match[1])))
    assert.doesNotMatch(content.markdown, /<(?:ProjectStyleExample|PackageTree|PackageAuthoringExample|DemoFeatureSupport|DemoViewTransition)|MCSS_EXPRESSION/)
    for (const fence of source.matchAll(/```[\s\S]*?```/g)) {
      const authored = fence[0].replace(/<!--\s*@MARK[\s\S]*?-->/g, '')
      assert.ok(content.markdown.includes(authored), `${slug}: complete authored fence`)
    }
  }
  const compatibility = await projectStyleGuideContent(root, 'compatibility')
  assert.ok(compatibility.markdown.includes('CSS.supports(property, value)'))
  assert.doesNotMatch(compatibility.markdown, /```css\n\s*```/)
  const transitions = await projectStyleGuideContent(root, 'view-transitions')
  assert.ok(transitions.markdown.includes('[Interactive article transition preview](/guide/view-transitions#article-list-to-detail)'))
  assert.ok(transitions.markdown.includes('The same `view-transition-name` must be unique'))
  assert.ok(transitions.markdown.includes('## Reduced motion'))
  const theme = await projectStyleGuideContent(root, 'theme')
  assert.ok(theme.markdown.includes('--color-brand: #4f46e5'))
  assert.ok(theme.markdown.includes('## Add mode-aware values'))
  for (const slug of ['variables-and-modes', 'cascade-layers']) {
    const source = await readFile(path.join(root, `app/[locale]/guide/${slug}/content.mdx`), 'utf8')
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
  assert.match(css, /@layer components\s*\{\s*\.card\{/)
  assert.match(css, /@layer utilities\{/)
  assert.match(css, /\.p-sm\{padding:var\(--spacing-sm\)\}/)
  const modes = projectStyleExamples.modes
  assert.match(configuredExampleCSS(modes.source, configuredMarkupClasses(modes.html)), /\.dark\{/)
  assert.throws(() => projectStyleExample('toString'), /Unknown project style/)
})

test('direct configured demo props export literal HTML and CSS without executing JSX', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'project-style-export-'))
  try {
    const file = path.join(root, 'content.mdx')
    await writeFile(file, '<DemoConfiguredExample name="spacing" title="Padding" source="@theme { --spacing-card: 1.5rem; }" html={\'<article class="p-card">Collection</article>\'} caption="Shared padding." />')
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
    'getting-started', 'agentic-workflows', 'authoring', 'fundamentals', 'design-foundations', 'build--delivery'
  ])
  for (const section of sections) for (const entry of section.entries) assert.ok(markdown.includes(`](${entry.url})`), entry.url)
  assert.ok(markdown.includes('<a id="syntax-tutorial"></a>'))
  assert.equal(sections[0].entries[2].url, '/guide/syntax-tutorial')
  const searchPages = JSON.parse(await readFile(new URL('../public/search/en.json', import.meta.url), 'utf8'))
  assert.deepEqual(searchPages.find((page: { url: string }) => page.url === '/guide').nodes, nodes)
  const source = await readFile(new URL('../app/[locale]/guide/content.mdx', import.meta.url), 'utf8')
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
  const pages = await loadPages(`${root}/app/[locale]`)
  const tutorial = pages.find(page => page.url === '/en/guide/syntax-tutorial')
  assert.equal(tutorial?.body, (await syntaxTutorialContent(root)).markdown)
  for (const slug of Object.keys(legacySyntaxPages)) assert.ok(!pages.some(page => page.url === `/en/guide/${slug}`))
  assert.match(renderLlmsFull(pages), /--spacing-action:1rem/)
})

test('all foundation bodies preserve generated CSS and agree with search and llms exports', async () => {
  const root = fileURLToPath(new URL('../', import.meta.url))
  const pages = await loadPages(`${root}/app/[locale]`)
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
  assert.match(typography.markdown, /### Without vs with `text:<size>`/)
  assert.ok(extractSearchNodesFromMdx(typography.searchMarkdown).some(node => node.id === 'without-vs-with-textsize'))
})

test('foundation exports include all native token values and their visible table descriptions', async () => {
  const root = fileURLToPath(new URL('../', import.meta.url))
  const bodies = Object.fromEntries(await Promise.all(foundationGuideSlugs.map(async slug => [slug, (await foundationGuideContent(root, slug)).markdown])))
  for (const [slug, rows] of [['motion', [...getAnimationRows(), ...getDurationRows(), ...getEasingRows()]]] as const) {
    for (const row of rows) {
      assert.ok(row.description, row.token)
      for (const value of [row.token, row.value, row.description, ...row.utilities]) assert.ok(bodies[slug].includes(value), `${slug}: ${value}`)
    }
  }
  for (const role of getFontWeightRows().map(row => row.utilities[0].slice('font-'.length))) assert.ok(bodies.typography.includes(`font-${role}`), role)
  for (const [group, rows] of Object.entries(rowsByGroup)) for (const row of rows) {
    for (const value of [row.token, row.light, row.dark, rowDescriptionByGroup[group as keyof typeof rowsByGroup](row.key)]) assert.ok(bodies.colors.includes(value), `colors: ${value}`)
  }
  for (const variable of getThemeVariables('color').filter(variable => /^color-.+-\d+$/.test(variable.name ?? ''))) {
    assert.ok(bodies.colors.includes(`--${variable.name}`), variable.name)
    assert.ok(bodies.colors.includes(String(variable.value)), variable.name)
  }
  for (const [slug, namespace] of [['spacing', 'spacing'], ['sizing', 'container'], ['containers', 'container'], ['breakpoints', 'breakpoint'], ['corner-radius', 'radius']]) {
    for (const entry of getThemeNumericVariableEntries(namespace)) {
      assert.ok(bodies[slug].includes(`--${namespace}-${entry.key}`), `${slug}: ${entry.key}`)
      assert.ok(bodies[slug].includes(entry.value), `${slug}: ${entry.value}`)
    }
  }
})

test('typography exports its local Overview and all eight referenced lessons in full', async () => {
  const root = fileURLToPath(new URL('../', import.meta.url))
  const file = `${root}/app/[locale]/guide/typography/content.mdx`
  const source = await readFile(file, 'utf8')
  const content = await foundationGuideContent(root, 'typography')
  const imports = [...source.matchAll(/^import \w+ from '(.+?\.mdx)'/gm)]
  assert.equal(imports.length, 8)
  for (const [, target] of imports) {
    const included = await extractReferenceMdx(path.resolve(path.dirname(file), target))
    assert.deepEqual(included.notes, [])
    assert.ok(content.markdown.includes(portableMarkdown(included.markdown)), target)
  }
  assert.match(content.markdown, /Architectural/)
  assert.match(content.markdown, /Future-proof infrastructure/)
})

test('foundation extraction fails on missing adapters and recursive includes without executing JSX', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'master-foundation-export-'))
  const directory = path.join(root, 'app/[locale]/guide/typography')
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

test('delivery guides retain ordered process text, complete fences and generated examples in exports', async () => {
  const root = fileURLToPath(new URL('..', import.meta.url))
  const pages = await loadPages(path.join(root, 'app/[locale]'))
  for (const slug of deliveryGuideSlugs) {
    const content = await deliveryGuideContent(root, slug)
    assert.deepEqual(content.notes, [])
    assert.equal(pages.find(page => page.url === `/en/guide/${slug}`)?.body, content.markdown)
    const source = await readFile(path.join(root, `app/[locale]/guide/${slug}/content.mdx`), 'utf8')
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
  const pages = await loadPages(path.join(root, 'app/[locale]'))
  for (const slug of toolingGuideSlugs) {
    const content = await toolingGuideContent(root, slug)
    assert.deepEqual(content.notes, [])
    assert.equal(pages.find(page => page.url === `/en/guide/${slug}`)?.body, content.markdown)
    const source = await readFile(path.join(root, `app/[locale]/guide/${slug}/content.mdx`), 'utf8')
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

test('agent guides export complete prompts, tool catalogs, preview workflow and native examples', async () => {
  const root = fileURLToPath(new URL('..', import.meta.url))
  const pages = await loadPages(path.join(root, 'app/[locale]'))
  for (const slug of agentGuideSlugs) {
    const content = await agentGuideContent(root, slug)
    assert.deepEqual(content.notes, [])
    assert.equal(pages.find(page => page.url === `/en/guide/${slug}`)?.body, content.markdown)
    const source = await readFile(path.join(root, `app/[locale]/guide/${slug}/content.mdx`), 'utf8')
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

test('tool references export readable parameters, complete schemas and literal examples in both locales', async () => {
  const root = fileURLToPath(new URL('..', import.meta.url))
  const { renderDocumentMarkdown } = await import('../reference/build')
  const catalog = JSON.parse(await readFile(path.join(root, '.generated/reference.json'), 'utf8'))
  const docs = catalog.documents.filter((doc: any) => doc.kind === 'tool')
  assert.equal(docs.length, 24)
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
      for (const term of ['Input', 'Example', 'Output'].filter(term => doc.id.startsWith('tools/mcp/'))) assert.ok(indexed.nodes.some((node: any) => node.text?.includes(term) || node.title?.includes(term)), `${doc.id}: ${term}`)
      assert.doesNotMatch(body, /<(?:DocumentParameters|DocumentDisclosure)/)
    }
  }
})


test('package references retain full declarations, import guidance and symbol indexes in portable output', async () => {
  const root = fileURLToPath(new URL('..', import.meta.url))
  const { renderDocumentMarkdown } = await import('../reference/build')
  const catalog = JSON.parse(await readFile(path.join(root, '.generated/reference.json'), 'utf8'))
  const docs = catalog.documents.filter((doc: any) => doc.kind === 'package')
  assert.equal(docs.length, 20)
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
        const explicit = /^(entry|api)-/.test(heading.id)
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
  assert.equal(docs.length, 10)
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
    const sourcePath = ['', 'integrations', 'cli', 'cdn'].includes(slug) ? `(main)/${slug}` : slug
    const source = await readFile(path.join(root, `app/[locale]/guide/installation/${sourcePath}/content.mdx`), 'utf8')
    const normalizeFence = (value: string) => value.replace(/<!--\s*@MARK[\s\S]*?-->/g, '').split('\n').map(line => line.trim()).join('\n').trim()
    const exportedFences = deliveryFences(content.markdown).map(fence => normalizeFence(fence.text))
    for (const fence of deliveryFences(source)) assert.ok(exportedFences.includes(normalizeFence(fence.text)), `${slug}: ${fence.name}`)
    assert.doesNotMatch(content.markdown, /<(?:DocumentStep|DocumentChoice|InstallationGuides|DemoConfiguredExample)|MCSS_EXPRESSION/)
    if (slug === 'integrations') assert.ok(content.markdown.includes(installationGuidesMarkdown()))
    const url = `/guide/installation${slug ? `/${slug}` : ''}`
    for (const heading of previous[url]) {
      const explicit = source.includes(`{#${heading.id}`)
      if (explicit) assert.ok(content.markdown.includes(`id="${heading.id}"`), `${slug}: ${heading.id}`)
    }
    for (const locale of ['en', 'tw']) {
      const search = JSON.parse(await readFile(path.join(root, `public/search/${locale}.json`), 'utf8'))
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


test('brand downloads retain their asset URLs, labels and policy in portable and search output', async () => {
  const root = fileURLToPath(new URL('../', import.meta.url))
  const content = await brandContent(root)
  const pages = await loadPages(path.join(root, 'app/[locale]'))
  assert.equal(pages.find(page => page.url === '/en/brand')?.body, content.markdown)
  for (const name of ['css-logotype@dark.svg', 'css-logotype@light.svg', 'logo.svg']) {
    assert.ok(content.markdown.includes(`/images/${name}`), name)
    assert.ok(content.markdown.includes('Download '))
    assert.match(await readFile(path.join(root, 'public/images', name), 'utf8'), /<svg\b/)
  }
  for (const title of ['Download assets', 'Logotype', 'Mark', 'Trademark policy', 'Name usage']) assert.ok(content.markdown.includes(title), title)
  assert.ok(content.markdown.includes('without written consent'))
  assert.doesNotMatch(content.markdown, /<DemoAsset|MCSS_EXPRESSION/)
  for (const locale of ['en', 'tw']) {
    const search = JSON.parse(await readFile(path.join(root, `public/search/${locale}.json`), 'utf8'))
    const page = search.find((entry: { url: string }) => entry.url.replace(/^\/(en|tw)(?=\/)/, '') === '/brand')
    assert.deepEqual(page.nodes, extractSearchNodesFromMdx(content.searchMarkdown))
  }
})


test('introduction retains its authored panel code in portable and search output', async () => {
  const root = fileURLToPath(new URL('../', import.meta.url))
  const content = await introductionContent(root)
  const pages = await loadPages(path.join(root, 'app/[locale]'))
  assert.equal(pages.find(page => page.url === '/en/guide/introduction')?.body, content.markdown)
  for (const text of ['Launch panel', 'Build the first screen in markup', 'Dashboard', 'gap-md', 'font-2xl', 'surface-raised shadow-lg']) assert.ok(content.markdown.includes(text), text)
  assert.doesNotMatch(content.markdown, /<Overview|<DemoConfiguredExample|MCSS_EXPRESSION/)
  for (const locale of ['en', 'tw']) {
    const search = JSON.parse(await readFile(path.join(root, `public/search/${locale}.json`), 'utf8'))
    const page = search.find((entry: { url: string }) => entry.url.replace(/^\/(en|tw)(?=\/)/, '') === '/guide/introduction')
    assert.deepEqual(page.nodes, extractSearchNodesFromMdx(content.searchMarkdown))
  }
})

test('benchmarks export the same chart values and complete tables as the page', async () => {
  const { benchmarkContent, benchmarkContentComponents, benchmarkMarkdown } = await import('../utils/benchmark-content')
  const { createElement, Fragment } = await import('react')
  const { benchmarkLabel } = await import('../utils/benchmark-content')
  const { BenchmarkBars } = await import('../components/benchmarks')
  const root = fileURLToPath(new URL('../', import.meta.url))
  const content = await benchmarkContent(root)
  const pages = await loadPages(path.join(root, 'app/[locale]'))
  assert.equal(pages.find(page => page.url === '/en/guide/benchmarks')?.body, content.markdown)
  const snapshot = JSON.parse(await readFile(path.join(root, '../benchmarks/docs-page-css-size/snapshot.json'), 'utf8'))
  for (const page of snapshot.pages) {
    assert.ok(content.markdown.includes(`| ${page.name} | ${(page.css.total.rawBytes / 1000).toFixed(1)} kB | ${(page.css.total.brotliBytes / 1000).toFixed(1)} kB |`), page.name)
  }
  for (const [name, component] of Object.entries(benchmarkContentComponents)) {
    if (name === 'BenchmarkSnapshot') continue
    const rendered = benchmarkMarkdown((component as () => import('react').ReactNode)())
    assert.ok(rendered.includes('|'), name)
    assert.ok(content.markdown.includes(rendered.trim().replace(/\n{3,}/g, '\n\n')), name)
  }
  for (const text of ['Five-minute lifecycle evidence', 'Complete interaction cost data', 'Static CSS output, structure, and production build', 'not real Web Vitals INP']) assert.ok(content.markdown.includes(text), text)
  assert.doesNotMatch(content.markdown, /<Benchmark|<StaticCSS|\[object Object\]|MCSS_EXPRESSION/)
  for (const locale of ['en', 'tw']) {
    const search = JSON.parse(await readFile(path.join(root, `public/search/${locale}.json`), 'utf8'))
    const page = search.find((entry: { url: string }) => entry.url.replace(/^\/(en|tw)(?=\/)/, '') === '/guide/benchmarks')
    assert.deepEqual(page.nodes, extractSearchNodesFromMdx(content.searchMarkdown))
  }
  const fragment = createElement(Fragment, null, 'Fixture ', createElement('strong', null, 'A'))
  assert.equal(benchmarkLabel(fragment), 'Fixture A')
  assert.match(benchmarkMarkdown(createElement(BenchmarkBars, { items: [{ id: 'zero', label: fragment, value: 0 }], unit: 'ms' })), /Fixture A \| 0 ms/)
  assert.throws(() => benchmarkMarkdown(createElement(() => null)), /Unregistered benchmark presentation/)
})
