import { readdir, readFile, writeFile, mkdir, rm } from 'node:fs/promises'
import path from 'node:path'
import generateManifestCondition from '../utils/generate-manifest-condition'
import { pathToFileURL } from 'node:url'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { documentHeadings } from './headings'
import { extractSearchNodesFromMdx } from '~/site/docs-shell/utils/search-pages'
import { builtinKeyAliases, builtinTokenNamespaces } from '@master/css-tooling/builtins'
import { flattenMasterCSSManifestVariables, type MasterCSSManifest } from '@master/css-schema/manifest'
import preset from '../utils/preset-manifest'
import { getVariableNamespacePublicKeys } from '../utils/manifest-utilities'
import { resolveSyntaxRow } from './syntax'
import { extractReferenceMdx, portableMarkdown } from './markdown'
import { utilityEditorial, ruleSources } from './editorial'
import { generatePresetCSS } from '../common/generate-preset-css'
import type { ReferenceCatalog, ReferenceDocument } from './types'
import { buildToolContracts } from './tool-contracts'
import { buildPackageContracts } from './package-contracts'
import { tokenEditorial } from './token-editorial'

export const digest = (value: string) => createHash('sha256').update(value).digest('hex')
const fence = (lang: string, value: string) => `\`\`\`${lang}\n${value}\n\`\`\``

export { documentHeadings } from './headings'

export async function buildReferenceCatalog(siteRoot: string): Promise<ReferenceCatalog> {
  const root = path.join(siteRoot, 'app/[locale]')
  const documents: ReferenceDocument[] = []
  const relative = (file: string) => path.relative(path.dirname(siteRoot), file).split(path.sep).join('/')
  async function fromMdx(id: string, kind: ReferenceDocument['kind'], file: string, title: string, description: string, category: string) {
    const extracted = await extractReferenceMdx(file)
    return {
      id, kind, title, description, category, url: `/reference/${id}`, source: relative(file), language: 'en' as const,
      sourceDigest: digest(await readFile(file, 'utf8')), aliases: [], terms: [], rows: [], related: [],
      examples: extracted.examples, markdown: extracted.markdown, headings: documentHeadings(extracted.markdown), extractionNotes: extracted.notes
    } satisfies ReferenceDocument
  }
  for (const entry of (await readdir(path.join(root, 'reference'), { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.isDirectory() || entry.name.startsWith('[')) continue
    const directory = path.join(root, 'reference', entry.name)
    const metadataFile = path.join(directory, 'metadata.ts')
    const metadata = await import(pathToFileURL(metadataFile).href).then(m => m.default, () => null)
    if (!metadata) continue
    const syntaxes = await import(pathToFileURL(path.join(directory, 'syntaxes.ts')).href).then(m => m.default, () => [])
    const previewSource = await readFile(path.join(directory, 'components/Overview.tsx'), 'utf8').catch(() => '')
    const preview = previewSource.match(/(?:const previewSyntax =|previewSyntax=)\s*['"]([^'"]+)/)?.[1]
    const rows = (syntaxes as (string | string[])[]).map(value => resolveSyntaxRow(value, preview))
    const file = path.join(directory, 'content.mdx')
    const extracted = await extractReferenceMdx(file, rows)
    const properties = new Set(rows.flatMap(row => row.identifiers.filter(id => !id.endsWith(':'))))
    const aliases = [...new Set([...extracted.examples.flatMap(example => example.classes), ...rows.flatMap(row => row.identifiers), ...Object.entries(builtinKeyAliases).filter(([, property]) => properties.has(property)).map(([alias]) => `${alias}:`)])]
    const doc: ReferenceDocument = {
      id: entry.name, kind: 'utility', title: metadata.title, description: metadata.description,
      category: metadata.category, url: `/reference/${entry.name}`, source: relative(file), sourceDigest: digest(await readFile(file, 'utf8')),
      language: 'en', aliases, terms: [], rows, examples: extracted.examples, related: ['rules/conditions'],
      markdown: extracted.markdown, headings: documentHeadings(extracted.markdown), extractionNotes: extracted.notes,
      ...utilityEditorial[entry.name]
    }
    documents.push(doc)
  }
  for (const rule of ruleSources) {
    const doc: ReferenceDocument = await fromMdx(rule.id, 'rule', path.join(root, rule.source), rule.title, rule.description, 'Syntax & rules')
    doc.guide = rule.guide
    doc.terms = rule.terms ?? []
    doc.related = ['rules/declarations', 'rules/selectors', 'rules/conditions', 'rules/modes', 'rules/layers'].filter(id => id !== rule.id)
    if (rule.id === 'rules/conditions') {
      const classes = ['fg-red:hover@sm']
      const css = generatePresetCSS(classes)
      const example = { id: 'composition', title: 'Combine a state, breakpoint and color token', classes, css }
      doc.examples.unshift(example)
      doc.aliases = classes
      doc.markdown = `## Composition\n\n${fence('html', '<div class="fg-red:hover@sm">Hover at sm and above</div>')}\n\nWith the current preset, \`fg-red\` uses \`--color-red\`, \`:hover\` selects the hovered element, and \`@sm\` applies \`${generatePresetCSS(['opacity:1@sm']).match(/@media\s*([^{}]+)/)?.[1]?.trim()}\`. The color token changes with the active mode; the breakpoint determines when the rule applies. The final result also depends on the CSS cascade.\n\nLoad the base stylesheet (normally through \`@import '@master/css'\`) to establish \`@layer theme, base, defaults, components, utilities;\`. The generated rules below include theme dependencies; they do not add the base layer statement. Custom project settings can change tokens, conditions and modes.\n\n### Complete generated CSS\n\n${fence('css', css)}\n\n${doc.markdown}`
    }
    doc.headings = documentHeadings(doc.markdown)
    documents.push(doc)
  }
  const variables = flattenMasterCSSManifestVariables((preset as MasterCSSManifest).variables)
  for (const namespace of [...new Set(variables.map(variable => variable.namespace).filter(Boolean))].sort() as string[]) {
    const entries = variables.filter(variable => variable.namespace === namespace)
    const consumers = getVariableNamespacePublicKeys(namespace)
    const text = entries.map(variable => {
      const values = [variable.value === undefined ? '' : `Default: ${String(variable.value)}`, ...Object.entries(variable.modes ?? {}).map(([mode, value]) => `${mode}: ${String(value.value)}`)].filter(Boolean)
      return `### ${variable.key}\n\nCSS variable: \`--${variable.name}\`.\n\n${values.map(value => fence('text', value)).join('\n\n')}`
    }).join('\n\n')
    const context = tokenEditorial[namespace]
    const markdown = `## Scope\n\nThese values come from the current preset. Project theme declarations can override them. Mode-specific entries are labeled separately.${context ? `\n\n${context.context}` : ''}\n\n## Values\n\n${text}\n\n## Consumers\n\n${consumers.map(key => `\`${key}-\``).join(', ') || 'Use an explicit CSS variable reference.'}\n\n## Customize\n\nSee [variables and modes](/reference/rules/modes) and [theme directives](/reference/directives/theme).${context ? ` For usage and examples, see [${context.label}](${context.guide}).` : ''}`
    const headings = documentHeadings(markdown)
    const anchors = new Map(headings.filter(heading => heading.depth === 3).map(heading => [heading.title, heading.id]))
    const identifierAnchors = Object.fromEntries(entries.flatMap(variable => [variable.key, variable.name, `--${variable.name}`].map(name => [name, anchors.get(variable.key)!])))
    documents.push({ id: `tokens/${namespace}`, kind: 'tokens', title: namespace, description: `Preset ${namespace} values and their consumers.`, category: 'Tokens & namespaces', url: `/reference/tokens/${namespace}`, source: 'packages/preset/src/default-manifest.json', sourceDigest: digest(JSON.stringify(entries)), language: 'en', aliases: entries.flatMap(variable => [variable.key, variable.name, `--${variable.name}`]), identifierAnchors, terms: [namespace, ...consumers], rows: [], examples: [], related: ['rules/modes', 'directives/theme'], markdown, headings, extractionNotes: [] })
  }
  for (const [id, title, conditions] of [ ['breakpoints', 'Breakpoints', preset.breakpointConditions], ['containers', 'Containers', preset.containerConditions] ] as const) {
    const usage = id === 'containers'
      ? 'Append a condition such as `@container((width>=28rem))` to a class. It measures an eligible ancestor query container; establish that container with `container` or a named container declaration.'
      : 'Append a condition such as `@md` to a class. It measures the viewport width, independently of a component’s available width.'
    const markdown = `## Conditions\n\nThese thresholds come from the current preset. Breakpoints have named entrances; container thresholds use complete native queries. Project theme tokens can override the values.\n\n${usage} Each example below shows the complete generated CSS for an opacity class at that threshold.\n\n${Object.entries(conditions ?? {}).map(([name, condition]) => `### ${name}\n\n${fence('css', generatePresetCSS([`opacity:1@${id === 'containers' ? `container(${generateManifestCondition(condition).replace(/^@container /, '').replaceAll(' ', '|')})` : name}`]))}`).join('\n\n')}\n\nSee [conditions](/reference/rules/conditions) for syntax and composition, or the [${id} guide](/guide/${id}) for working examples.`
    documents.push({ id: `tokens/${id}`, kind: 'tokens', title, description: `Named ${id} conditions in the current preset.`, category: 'Tokens & namespaces', url: `/reference/tokens/${id}`, source: 'packages/preset/src/default-manifest.json', sourceDigest: digest(JSON.stringify(conditions)), language: 'en', aliases: Object.entries(conditions ?? {}).map(([key, condition]) => id === 'containers' ? `@container(${generateManifestCondition(condition).replace(/^@container /, '').replaceAll(' ', '|')})` : `@${key}`), terms: [], rows: [], examples: [], related: ['rules/conditions'], markdown, headings: documentHeadings(markdown), extractionNotes: [] })
  }
  // Directive sections are maintained once, in the existing directive source during migration.
  const directive = await fromMdx('directives', 'directive', path.join(root, 'guide/directives/contract.mdx'), 'Directives', 'Stylesheet directives, their scope and effects.', 'Directives & settings')
  const sections = directive.markdown.split(/(?=^## )/m)
  const mapping: Record<string, string> = { 'Entry markers': 'entry', 'Reference context': 'reference', 'Project settings': 'settings', 'Theme and variants': 'theme', 'Managed definitions': 'definitions', 'Source boundaries': 'source', 'Candidate policy': 'candidates', 'Rule-local composition': 'compose', 'Conditional blocks': 'variant', 'Native CSS preservation': 'preserve' }
  const descriptions: Record<string, string> = {
    'entry': 'Choose where generated utility CSS is inserted and which package styles are loaded.',
    'reference': 'Use another stylesheet’s tokens and definitions without importing its native CSS.',
    'settings': 'Configure selector scope and generated importance; define mode activation with @mode.',
    'theme': 'Declare tokens, mode values, managed keyframes and reusable conditions.',
    'definitions': 'Define named, enumerated and dynamic classes in the appropriate cascade layer.',
    'source': 'Include or exclude source files while preserving each stylesheet’s path base.',
    'candidates': 'Include known class names or reject unwanted scanning candidates.',
    'compose': 'Turn an unquoted class list into declarations for the current CSS selector.',
    'variant': 'Apply a Master CSS condition inside a native rule or managed definition.',
    'preserve': 'Keep a stylesheet’s native class rules when source-based pruning would remove them.'
}
  for (const section of sections) {
    const title = section.match(/^## (.+)/)?.[1]?.replace(/\s+\{#[\w-]+\}$/, '')
    const id = title && mapping[title]
    if (!id) continue
    const markdown = `${section.trim().replace(/\n---$/, '').trim()}\n\n<a id="related-contracts"></a>`
    const headings = documentHeadings(markdown)
    const identifiers = headings.filter(heading => heading.title.startsWith('@')).flatMap(heading => [[heading.title, heading.id], [heading.title.split(' ')[0], heading.id]])
    const identifierAnchors = Object.fromEntries(identifiers.reverse())
    documents.push({ ...directive, id: `directives/${id}`, url: `/reference/directives/${id}`, title: title!, description: descriptions[id], markdown, headings, aliases: Object.keys(identifierAnchors), identifierAnchors, related: ['rules/declarations', 'rules/layers', 'rules/extraction'], guide: id === 'theme' ? '/guide/theme' : ['source', 'candidates'].includes(id) ? '/guide/scanning-latent-classes' : '/guide/global-styles' })
  }
  let revision = 'unknown'
  let sourceState: ReferenceCatalog['sourceState'] = 'archive'
  documents.push(...await buildToolContracts(path.dirname(siteRoot)))
  documents.push(...await buildPackageContracts(path.dirname(siteRoot)))
  try {
    revision = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: siteRoot, encoding: 'utf8' }).trim()
    sourceState = execFileSync('git', ['status', '--porcelain', '--', 'site', 'packages'], { cwd: path.dirname(siteRoot), encoding: 'utf8' }).trim() ? 'working-tree' : 'revision'
  } catch { /* source archives have no git metadata */ }
  const version = process.env.NEXT_PUBLIC_VERSION ?? JSON.parse(await readFile(path.join(siteRoot, '.generated/public-env.json'), 'utf8').catch(() => '{}')).NEXT_PUBLIC_VERSION ?? `workspace-${revision.slice(0, 7)}`
  return { schemaVersion: 1, version, revision, sourceState, semanticDigest: digest(JSON.stringify({ preset, builtinKeyAliases, builtinTokenNamespaces })), documents }
}

export function renderDocumentMarkdown(doc: ReferenceDocument, catalog: ReferenceCatalog, locale = 'en') {
  const markdown = portableMarkdown(doc.markdown)
  return `# ${doc.title}\n\n${doc.description}\n\n- ID: ${doc.id}\n- Type: ${doc.kind}\n- Canonical: ${doc.url}\n- Version: ${catalog.version}\n- Source revision: ${catalog.revision} (${catalog.sourceState})\n- Source: ${doc.source}\n- Content digest: ${digest(doc.markdown)}\n- Semantic digest: ${catalog.semanticDigest}\n- Language: ${doc.language}${locale === 'tw' ? ' (English fallback; 尚無繁中全文翻譯)' : ''}\n\n${doc.kind === 'utility' ? '> Syntax placeholders illustrate declaration shapes; they are not an exhaustive grammar for valid values. Examples use the current preset.\n\n' : ''}${markdown}\n\n## Related reference\n\n${doc.related.map(id => `- [${id}](/reference/${id}.md)`).join('\n')}${doc.extractionNotes.length ? `\n\n## Additional interactive content\n\nThe HTML page contains additional presentation components: ${doc.extractionNotes.join('; ')}.` : ''}\n`
}

export async function generateReference(siteRoot: string) {
  const catalog = await buildReferenceCatalog(siteRoot)
  // These two prefixes contain only generated Reference artifacts.
  await rm(path.join(siteRoot, 'public/reference'), { recursive: true, force: true })
  await rm(path.join(siteRoot, 'public/tw/reference'), { recursive: true, force: true })
  await mkdir(path.join(siteRoot, '.generated'), { recursive: true })
  await writeFile(path.join(siteRoot, '.generated/reference.json'), JSON.stringify(catalog))
  for (const locale of ['en', 'tw']) {
    for (const doc of catalog.documents) {
      const filename = path.join(siteRoot, 'public', ...(locale === 'tw' ? ['tw'] : []), `${doc.url}.md`)
      await mkdir(path.dirname(filename), { recursive: true })
      await writeFile(filename, renderDocumentMarkdown(doc, catalog, locale))
    }
    const searchFile = path.join(siteRoot, `public/search/${locale}.json`)
    const existing = JSON.parse(await readFile(searchFile, 'utf8').catch(() => '[]'))
    const pages = catalog.documents.map(doc => ({
      title: doc.title, description: doc.description, category: doc.category, kind: doc.kind,
      url: `${locale === 'tw' ? '/tw' : ''}${doc.url}`,
      identifiers: doc.aliases.map(text => ({ text, id: doc.identifierAnchors?.[text] ?? doc.rows.find(row => row.identifiers.includes(text))?.id, detail: doc.rows.find(row => row.identifiers.includes(text))?.declarations })),
      terms: doc.terms,
      nodes: [...doc.rows.map(row => ({ id: row.id, tag: 'code', text: `${row.syntax} → ${row.declarations}` })), ...extractSearchNodesFromMdx(doc.markdown)]
    }))
    await mkdir(path.dirname(searchFile), { recursive: true })
    await writeFile(searchFile, JSON.stringify([...existing.filter((page: any) => !pages.some(doc => doc.url === page.url)), ...pages]))
  }
  const index = { ...catalog, documents: catalog.documents.map(({ markdown, rows, examples, headings, extractionNotes, ...doc }) => ({ ...doc, markdownUrl: `${doc.url}.md`, contentDigest: digest(markdown) })) }
  await mkdir(path.join(siteRoot, 'public/reference'), { recursive: true })
  await writeFile(path.join(siteRoot, 'public/reference/index.json'), JSON.stringify(index, null, 2))
  const pagesFile = path.join(siteRoot, '.pages.json')
  const pages = JSON.parse(await readFile(pagesFile, 'utf8').catch(() => '[]'))
  for (const doc of catalog.documents) if (!pages.some((page: any) => page.pathname === doc.url)) pages.push({ pathname: doc.url })
  await writeFile(pagesFile, JSON.stringify(pages))
  for (const kind of [...new Set(catalog.documents.map(doc => doc.kind))]) {
    await writeFile(path.join(siteRoot, `public/reference/${kind}.txt`), catalog.documents.filter(doc => doc.kind === kind).map(doc => renderDocumentMarkdown(doc, catalog)).join('\n---\n\n'))
  }
  return catalog
}
