import { buildRecipeContracts } from './recipes'
import { readFile, readdir, mkdir, rm } from 'node:fs/promises'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { documentHeadings } from './headings'
import { extractSearchNodesFromMdx } from '~/site/docs-shell/utils/search-pages'
import { builtinTokenFamilies, builtinTokenNamespaces } from '@master/css-tooling/builtins'
import preset from '../utils/preset-manifest'
import { extractReferenceMdx, portableMarkdown } from './markdown'
import { ruleSources } from './editorial'
import { generatePresetCSS } from '../common/generate-preset-css'
import type { ReferenceCatalog, ReferenceDocument } from './types'
import type { SearchPage } from '../docs-shell/utils/search-pages'
import { writeIfChanged } from '../scripts/write-if-changed'
import { buildToolContracts } from './tool-contracts'
import { buildPackageContracts } from './package-contracts'
import { buildTokenContracts } from './token-contracts'

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
  documents.push(...await buildRecipeContracts(siteRoot))
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
      doc.markdown = `## Composition\n\n${fence('html', '<div class="fg-red:hover@sm">Hover at sm and above</div>')}\n\nWith the current preset, \`fg-red\` uses \`--color-red\`, \`:hover\` selects the hovered element, and \`@sm\` applies \`${generatePresetCSS(['opacity:1@sm']).match(/@media\s*([^{}]+)/)?.[1]?.trim()}\`. The color token changes with the active mode; the breakpoint determines when the rule applies. The final result also depends on the CSS cascade.\n\nLoad the base stylesheet (normally through \`@import '@master/css'\`) to establish \`@layer theme, base, defaults, components, utilities;\`. The generated rules below include theme dependencies; they do not add the base layer statement. Project theme scopes and named conditions can override the preset.\n\n### Complete generated CSS\n\n${fence('css', css)}\n\n${doc.markdown}`
    }
    doc.headings = documentHeadings(doc.markdown)
    documents.push(doc)
  }
  documents.push(...buildTokenContracts())
  // Directive sections are maintained once, in the existing directive source during migration.
  const directive = await fromMdx('directives', 'directive', path.join(root, 'guide/directives/contract.mdx'), 'Directives', 'Stylesheet directives, their scope and effects.', 'Stylesheet directives')
  const sections = directive.markdown.split(/(?=^## )/m)
  const mapping: Record<string, string> = { 'Entry markers': 'entry', 'Reference context': 'reference', 'Theme and conditions': 'theme', 'Utilities and native styles': 'definitions', 'Source boundaries': 'source', 'Candidate policy': 'candidates', 'Conditional blocks': 'variant', 'Native CSS preservation': 'preserve' }
  const descriptions: Record<string, string> = {
    'entry': 'Choose where generated utility CSS is inserted and which package styles are loaded.',
    'reference': 'Use another stylesheet’s tokens and definitions without importing its native CSS.',
    'settings': 'Migrate removed global settings to native CSS and per-class importance.',
    'theme': 'Declare scoped custom properties, custom media and reusable mixins.',
    'definitions': 'Register on-demand utilities and author native defaults and components in CSS layers.',
    'source': 'Include or exclude source files while preserving each stylesheet’s path base.',
    'candidates': 'Include known class names or reject unwanted scanning candidates.',
    'compose': 'Migrate removed @compose statements to native CSS declarations and selectors.',
    'variant': 'Use native conditions and explicit mixin wrappers inside style rules.',
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
  return { schemaVersion: 1, version, revision, sourceState, semanticDigest: digest(JSON.stringify({ preset, builtinTokenFamilies, builtinTokenNamespaces })), documents }
}

export function renderDocumentMarkdown(doc: ReferenceDocument, catalog: ReferenceCatalog, locale = 'en') {
  const markdown = portableMarkdown(doc.markdown)
  return `# ${doc.title}\n\n${doc.description}\n\n- ID: ${doc.id}\n- Type: ${doc.kind}\n- Canonical: ${doc.url}\n- Version: ${catalog.version}\n- Source revision: ${catalog.revision} (${catalog.sourceState})\n- Source: ${doc.source}\n- Content digest: ${digest(doc.markdown)}\n- Semantic digest: ${catalog.semanticDigest}\n- Language: ${doc.language}${locale === 'tw' ? ' (English fallback; 尚無繁中全文翻譯)' : ''}\n\n${doc.kind === 'utility' ? '> Syntax placeholders illustrate declaration shapes; they are not an exhaustive grammar for valid values. Examples use the current preset.\n\n' : ''}${markdown}\n\n## Related reference\n\n${doc.related.map(id => `- [${id}](/reference/${id}.md)`).join('\n')}${doc.extractionNotes.length ? `\n\n## Additional interactive content\n\nThe HTML page contains additional presentation components: ${doc.extractionNotes.join('; ')}.` : ''}\n`
}

export async function generateReference(siteRoot: string, searchPages?: Record<string, SearchPage[]>, pageEntries?: any[]) {
  const catalog = await buildReferenceCatalog(siteRoot)
  const expectedFiles = new Set<string>()
  await mkdir(path.join(siteRoot, '.generated'), { recursive: true })
  await writeIfChanged(path.join(siteRoot, '.generated/reference.json'), JSON.stringify(catalog))
  const routeIndex = catalog.documents.map(({ id, kind, title, description, category, url }) => ({ id, kind, title, description, category, url }))
  await writeIfChanged(path.join(siteRoot, '.generated/reference-route-index.json'), JSON.stringify(routeIndex))
  const documentDir = path.join(siteRoot, '.generated/reference-documents')
  await mkdir(documentDir, { recursive: true })
  const expectedDocuments = new Set<string>()
  for (const doc of catalog.documents) {
    const filename = path.join(documentDir, `${encodeURIComponent(doc.id)}.json`)
    expectedDocuments.add(filename)
    await writeIfChanged(filename, JSON.stringify(doc))
  }
  await removeStaleGeneratedFiles(documentDir, expectedDocuments)
  for (const locale of ['en', 'tw']) {
    for (const doc of catalog.documents) {
      const filename = path.join(siteRoot, 'public', ...(locale === 'tw' ? ['tw'] : []), `${doc.url}.md`)
      expectedFiles.add(filename)
      await mkdir(path.dirname(filename), { recursive: true })
      await writeIfChanged(filename, renderDocumentMarkdown(doc, catalog, locale))
    }
    const searchFile = path.join(siteRoot, `public/search/${locale}.json`)
    const existing = searchPages?.[locale] ?? JSON.parse(await readFile(searchFile, 'utf8').catch(() => '[]'))
    const pages = catalog.documents.map(doc => ({
      title: doc.title, description: doc.description, category: doc.category, kind: doc.kind,
      url: `${locale === 'tw' ? '/tw' : ''}${doc.url}`,
      identifiers: doc.aliases.map(text => ({ text, id: doc.identifierAnchors?.[text] ?? doc.rows.find(row => row.identifiers.includes(text))?.id, detail: doc.rows.find(row => row.identifiers.includes(text))?.declarations })),
      terms: doc.terms,
      nodes: [...doc.rows.map(row => ({ id: row.id, tag: 'code', text: `${row.syntax} → ${row.declarations}` })), ...extractSearchNodesFromMdx(doc.markdown)]
    }))
    const merged = [...existing.filter((page: any) => !/^\/(?:en\/|tw\/)?reference\//.test(page.url) && !pages.some(doc => doc.url === page.url)), ...pages]
    if (searchPages) searchPages[locale] = merged
    else {
      await mkdir(path.dirname(searchFile), { recursive: true })
      await writeIfChanged(searchFile, JSON.stringify(merged))
    }
  }
  const index = { ...catalog, documents: catalog.documents.map(({ markdown, rows, examples, headings, extractionNotes, ...doc }) => ({ ...doc, markdownUrl: `${doc.url}.md`, contentDigest: digest(markdown) })) }
  const referenceDir = path.join(siteRoot, 'public/reference')
  await mkdir(referenceDir, { recursive: true })
  const indexFile = path.join(referenceDir, 'index.json')
  expectedFiles.add(indexFile)
  await writeIfChanged(indexFile, JSON.stringify(index, null, 2))
  const pagesFile = path.join(siteRoot, '.pages.json')
  const pages = pageEntries ?? JSON.parse(await readFile(pagesFile, 'utf8').catch(() => '[]'))
  for (const doc of catalog.documents) if (!pages.some((page: any) => page.pathname === doc.url)) pages.push({ pathname: doc.url })
  await writeIfChanged(pagesFile, JSON.stringify(pages))
  for (const kind of [...new Set(catalog.documents.map(doc => doc.kind))]) {
    const filename = path.join(referenceDir, `${kind}.txt`)
    expectedFiles.add(filename)
    await writeIfChanged(filename, catalog.documents.filter(doc => doc.kind === kind).map(doc => renderDocumentMarkdown(doc, catalog)).join('\n---\n\n'))
  }
  // These two prefixes contain only generated Reference artifacts.
  await removeStaleGeneratedFiles(referenceDir, expectedFiles)
  await removeStaleGeneratedFiles(path.join(siteRoot, 'public/tw/reference'), expectedFiles)
  return catalog
}

async function removeStaleGeneratedFiles(directory: string, expectedFiles: Set<string>) {
  const entries = await readdir(directory, { withFileTypes: true }).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') return []
    throw error
  })
  for (const entry of entries) {
    const filename = path.join(directory, entry.name)
    if (entry.isDirectory()) await removeStaleGeneratedFiles(filename, expectedFiles)
    else if (!expectedFiles.has(filename)) await rm(filename, { force: true })
  }
}
