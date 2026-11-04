import { readFile, readdir, mkdir, rm, access } from 'node:fs/promises'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readLocalizedDocument } from '@master/internal-site/build/localization.ts'
import { locales, languageOf, localizableOrigins } from '@master/internal-site/common/locales.js'
import { localizePathname } from '@master/internal-site/utils/i18n-pathname.ts'
import { transformMarkdownLinks } from '@master/internal-site/utils/markdown-links.ts'
import { extractSearchNodesFromMarkdown } from '@master/internal-site/utils/search-pages'
import { tokenFamilies } from '@master/internal-site/css/manifest-utilities.ts'
import preset from '@master/internal-site/css/preset-manifest.ts'
import type { SearchPage } from '@master/internal-site/utils/search-pages'
import { extractReferenceMdx, portableMarkdown } from './markdown'
import { directivePages, ruleSources } from './editorial'
import type { ReferenceCatalog, ReferenceDocument } from './types'
import { writeIfChanged } from '../scripts/write-if-changed'
import { buildRecipeContracts } from './recipes'
import { buildToolContracts } from './tool-contracts'
import { buildPackageContracts } from './package-contracts'
import { buildNamedConditionsContract } from './named-conditions'
import { buildTokenContracts } from './token-contracts'
import { referenceOverviewMarkdown } from './navigation-data'
import { assertRequiredReferenceDocument, referenceCopyResources, referenceEditorial, requiredReferenceContracts, referenceText as text } from './copy'
import { createReferenceRenderDocument, referenceRenderVersion, type ReferenceRenderDocument } from './render-document'

export const digest = (value: string) => createHash('sha256').update(value).digest('hex')
export { documentHeadings } from './headings'
import { documentHeadings } from './headings'

/** Identity URLs stay unprefixed in the catalog; every delivered URL uses this helper. */
export function referencePath(url: string, locale = 'en') {
  return locale === 'en' ? url : `/${locale}${url === '/' ? '' : url}`
}

export function localizeReferenceMarkdown(markdown: string, locale = 'en') {
  if (locale === 'en') return markdown
  return transformMarkdownLinks(markdown, url => /^\/(?:reference|guide|benchmarks)(?:\/[^?#]*)?\.md(?=[?#]|$)/.test(url)
    ? referencePath(url, locale)
    : localizePathname(url, { defaultLocale: 'en', locale, locales, localizablePathnameRoots: localizableOrigins['https://css.master.co'], localizableOrigins }))
}

/** Contracts are required catalog inputs, even when an ordinary article would be omitted as a draft. */
export async function readRequiredReferenceContract(sourceFile: string, locale = 'en') {
  const source = await readLocalizedDocument({ sourceFile, locale: 'en' })
  assertRequiredReferenceDocument(source.frontmatter, source.file)
  const localized = locale === 'en' ? source : await readLocalizedDocument({ sourceFile, locale })
  assertRequiredReferenceDocument(localized.frontmatter, localized.file)
  return localized
}

export async function buildReferenceCatalog(siteRoot: string, locale = 'en'): Promise<ReferenceCatalog> {
  const root = path.join(siteRoot, 'content')
  const documents: ReferenceDocument[] = []
  const relative = (file: string) => path.relative(path.dirname(siteRoot), file).split(path.sep).join('/')
  async function fromMdx(id: string, kind: ReferenceDocument['kind'], sourceFile: string, title: string, description: string, category: string) {
    const localized = await readRequiredReferenceContract(sourceFile, locale)
    const extracted = await extractReferenceMdx(localized.file, [], [], { locale })
    if (extracted.notes.length) throw new Error(`Incomplete Reference export ${id} (${locale}): ${extracted.notes.join('; ')}`)
    return {
      id, kind, title, description, category, url: `/reference/${id}`, source: relative(localized.file), language: languageOf(locale), locale,
      sourceDigest: digest(await readFile(sourceFile, 'utf8')), aliases: [], terms: [], rows: [], related: [],
      examples: extracted.examples, markdown: extracted.markdown, headings: documentHeadings(extracted.markdown), extractionNotes: extracted.notes,
    } satisfies ReferenceDocument
  }
  documents.push(...await buildRecipeContracts(siteRoot, locale))
  for (const original of ruleSources) {
    const rule = referenceEditorial(original, original.id, locale)
    const doc: ReferenceDocument = await fromMdx(rule.id, 'rule', path.join(root, rule.source), rule.title, rule.description, 'Syntax')
    doc.guide = rule.guide
    doc.terms = rule.terms ?? []
    doc.related = ['rules/declarations', 'rules/selectors', 'rules/conditions', 'rules/modes', 'rules/layers'].filter(id => id !== rule.id)
    documents.push(doc)
  }
  documents.push(buildNamedConditionsContract(locale), ...buildTokenContracts(locale))
  const directive = await fromMdx('directives', 'directive', path.join(root, 'guide/directives/contract.mdx'), '', '', 'Directives')
  const sections = new Map<string, string>()
  for (const section of directive.markdown.split(/(?=^## )/m)) {
    if (!section.startsWith('## ')) continue
    const id = section.match(/^## .+\{#([\w-]+)\}/)?.[1]
    if (!id) throw new Error(`Directive top-level section requires a stable ID (${locale}): ${section.split('\n')[0]}`)
    if (sections.has(id)) throw new Error(`Duplicate directive section: ${id} (${locale})`)
    sections.set(id, section)
  }
  const assigned = directivePages.flatMap(page => page.sections)
  for (const id of sections.keys()) if (assigned.filter(candidate => candidate === id).length !== 1) throw new Error(`Directive section must have exactly one published owner: ${id}`)
  for (const original of directivePages) {
    const page = referenceEditorial(original, `directives/${original.id}`, locale)
    const markdown = page.sections.map(id => {
      const section = sections.get(id)
      if (!section) throw new Error(`Missing directive section: ${id} (${locale})`)
      const [heading, ...body] = section.trim().replace(/\n---$/, '').trim().split('\n')
      const anchor = heading.match(/\{#([\w-]+)\}$/)?.[1]
      let fenced = false
      const lines = body.map(line => {
        if (line.startsWith('```')) fenced = !fenced
        return !fenced && line.startsWith('### ') ? line.slice(1) : line
      })
      return `${anchor ? `<a id="${anchor}"></a>\n\n` : ''}${lines.join('\n').trim()}`
    }).join('\n\n')
    const headings = documentHeadings(markdown)
    const identifiers = headings.filter(heading => heading.title.startsWith('@')).flatMap(heading => [[heading.title, heading.id], [heading.title.split(' ')[0], heading.id]])
    const identifierAnchors = Object.fromEntries(identifiers.reverse())
    documents.push({ ...directive, id: `directives/${page.id}`, url: `/reference/directives/${page.id}`, title: page.title, description: page.description, markdown, headings, aliases: Object.keys(identifierAnchors), identifierAnchors, related: ['rules/declarations', 'rules/conditions'], terms: page.terms ?? [] })
  }
  documents.push(...await buildToolContracts(path.dirname(siteRoot), locale), ...await buildPackageContracts(path.dirname(siteRoot), locale))
  for (const doc of documents) { doc.language = languageOf(locale); doc.locale = locale }
  let revision = 'unknown'
  let sourceState: ReferenceCatalog['sourceState'] = 'archive'
  try {
    revision = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: siteRoot, encoding: 'utf8' }).trim()
    sourceState = execFileSync('git', ['status', '--porcelain', '--', 'site', 'packages'], { cwd: path.dirname(siteRoot), encoding: 'utf8' }).trim() ? 'working-tree' : 'revision'
  } catch { /* source archives have no git metadata */ }
  const version = process.env.PUBLIC_VERSION ?? JSON.parse(await readFile(path.join(siteRoot, '.generated/public-env.json'), 'utf8').catch(() => '{}')).PUBLIC_VERSION ?? `workspace-${revision.slice(0, 7)}`
  return { schemaVersion: 1, locale, version, revision, sourceState, semanticDigest: digest(JSON.stringify({ preset, tokenFamilies })), documents }
}

export function renderDocumentMarkdown(doc: ReferenceDocument, catalog: ReferenceCatalog, locale = doc.locale ?? catalog.locale ?? 'en') {
  if (locale !== (doc.locale ?? catalog.locale ?? 'en')) throw new Error(`Reference document locale does not match export: ${doc.id} (${locale})`)
  const markdown = localizeReferenceMarkdown(portableMarkdown(doc.markdown), locale)
  const extra = doc.extractionNotes.length ? `\n\n## ${text('exports', 'additional', locale)}\n\n${text('exports', 'additional-body', locale).replace('%%components%%', doc.extractionNotes.join('; '))}` : ''
  return `# ${doc.title}\n\n${doc.description}\n\n- ID: ${doc.id}\n- Type: ${doc.kind}\n- Canonical: ${referencePath(doc.url, locale)}\n- Version: ${catalog.version}\n- Source revision: ${catalog.revision} (${catalog.sourceState})\n- Source: ${doc.source}\n- Content digest: ${digest(doc.markdown)}\n- Semantic digest: ${catalog.semanticDigest}\n- Language: ${doc.language}\n\n${doc.kind === 'utility' ? `> ${text('exports', 'syntax-note', locale)}\n\n` : ''}${markdown}\n\n## ${text('exports', 'related', locale)}\n\n${doc.related.map(id => `- [${id}](${referencePath(`/reference/${id}.md`, locale)})`).join('\n')}${extra}\n`
}

/** Development prepares complete local editions; production completeness is enforced before preparation. */
export async function referenceLocaleReady(siteRoot: string, locale: string) {
  if (locale === 'en') return true
  if (referenceCopyResources(siteRoot).some(resource => !resource.translations[locale])) return false
  return (await Promise.all(requiredReferenceContracts.map(file => access(path.join(siteRoot, 'content', file.replace(/\.mdx$/, `.${locale}.mdx`))).then(() => true, () => false)))).every(Boolean)
}

export async function generateReference(siteRoot: string, searchPages?: Record<string, SearchPage[]>, pageEntries?: any[]) {
  const catalogs: Record<string, ReferenceCatalog> = {}
  const indexes: Record<string, unknown[]> = {}
  const expectedFiles = new Set<string>()
  const expectedDocuments = new Set<string>()
  const documentDir = path.join(siteRoot, '.generated/reference-documents')
  await mkdir(path.join(siteRoot, '.generated'), { recursive: true })
  const renderVersion = await referenceRenderVersion(siteRoot)
  for (const locale of locales) {
    if (!await referenceLocaleReady(siteRoot, locale)) {
      await rm(path.join(siteRoot, `.generated/reference.${locale}.json`), { force: true })
      await rm(path.join(siteRoot, 'public', locale, 'reference.md'), { force: true })
      continue
    }
    const catalog = catalogs[locale] = await buildReferenceCatalog(siteRoot, locale)
    const prefix = locale === 'en' ? [] : [locale]
    const overview = referenceOverviewMarkdown(catalog.documents, locale)
    await writeIfChanged(path.join(siteRoot, `.generated/reference${locale === 'en' ? '' : `.${locale}`}.json`), JSON.stringify(catalog))
    indexes[locale] = catalog.documents.map(({ id, kind, title, description, category, url }) => ({ id, kind, title, description, category, url }))
    for (const doc of catalog.documents) {
      const filename = path.join(documentDir, locale, `${encodeURIComponent(doc.id)}.json`)
      expectedDocuments.add(filename)
      const previous = await readFile(filename, 'utf8').then(value => JSON.parse(value) as ReferenceRenderDocument).catch((error: NodeJS.ErrnoException) => {
        if (error.code === 'ENOENT') return undefined
        throw error
      })
      await mkdir(path.dirname(filename), { recursive: true })
      await writeIfChanged(filename, JSON.stringify(await createReferenceRenderDocument(doc, renderVersion, previous)))
      const markdownFile = path.join(siteRoot, 'public', ...prefix, `${doc.url}.md`)
      expectedFiles.add(markdownFile)
      await mkdir(path.dirname(markdownFile), { recursive: true })
      await writeIfChanged(markdownFile, renderDocumentMarkdown(doc, catalog, locale))
    }
    const overviewFile = path.join(siteRoot, 'public', ...prefix, 'reference.md')
    expectedFiles.add(overviewFile)
    await mkdir(path.dirname(overviewFile), { recursive: true })
    await writeIfChanged(overviewFile, `# ${text('overview', 'title', locale)}\n\n${text('overview', 'description', locale)}\n\n- Canonical: ${referencePath('/reference', locale)}\n- Language: ${languageOf(locale)}\n\n${localizeReferenceMarkdown(overview, locale)}`)
    const existing = searchPages?.[locale] ?? JSON.parse(await readFile(path.join(siteRoot, `public/search/${locale}.json`), 'utf8').catch(() => '[]'))
    const pages = [{ title: text('overview', 'title', locale), description: text('overview', 'description', locale), category: 'Overview', url: referencePath('/reference', locale), nodes: extractSearchNodesFromMarkdown(overview) }, ...catalog.documents.map(doc => ({
      title: doc.title, description: doc.description, category: doc.category, kind: doc.kind, url: referencePath(doc.url, locale),
      identifiers: doc.aliases.map(value => ({ text: value, id: doc.identifierAnchors?.[value] ?? doc.rows.find(row => row.identifiers.includes(value))?.id, detail: doc.rows.find(row => row.identifiers.includes(value))?.declarations })), terms: doc.terms,
      nodes: [...doc.rows.map(row => ({ id: row.id, tag: 'code', text: `${row.syntax} → ${row.declarations}` })), ...extractSearchNodesFromMarkdown(doc.markdown)],
    }))]
    const merged = [...existing.filter((page: SearchPage) => !/^\/(?:en\/|tw\/|ja\/|ko\/|cn\/)?reference(?:\/|$)/.test(page.url)), ...pages]
    if (searchPages) searchPages[locale] = merged
    else {
      const file = path.join(siteRoot, `public/search/${locale}.json`)
      await mkdir(path.dirname(file), { recursive: true })
      await writeIfChanged(file, JSON.stringify(merged))
    }
    const referenceDir = path.join(siteRoot, 'public', ...prefix, 'reference')
    await mkdir(referenceDir, { recursive: true })
    const indexFile = path.join(referenceDir, 'index.json')
    expectedFiles.add(indexFile)
    const index = { ...catalog, documents: catalog.documents.map(({ markdown, rows, examples, headings, extractionNotes, sheet, ...doc }) => ({ ...doc, url: referencePath(doc.url, locale), markdownUrl: referencePath(`${doc.url}.md`, locale), contentDigest: digest(markdown) })) }
    await writeIfChanged(indexFile, JSON.stringify(index, null, 2))
    for (const kind of [...new Set(catalog.documents.map(doc => doc.kind))]) {
      const file = path.join(referenceDir, `${kind}.txt`)
      expectedFiles.add(file)
      await writeIfChanged(file, catalog.documents.filter(doc => doc.kind === kind).map(doc => renderDocumentMarkdown(doc, catalog, locale)).join('\n---\n\n'))
    }
  }
  await writeIfChanged(path.join(siteRoot, '.generated/reference-route-index.json'), JSON.stringify(indexes.en))
  await writeIfChanged(path.join(siteRoot, '.generated/reference-route-indexes.json'), JSON.stringify(indexes))
  await removeStaleGeneratedFiles(documentDir, expectedDocuments)
  for (const locale of locales) await removeStaleGeneratedFiles(path.join(siteRoot, 'public', ...(locale === 'en' ? [] : [locale]), 'reference'), expectedFiles)
  const catalog = catalogs.en
  const pagesFile = path.join(siteRoot, '.pages.json')
  const currentRoutes = new Set(catalog.documents.map(doc => doc.url))
  const pages = (pageEntries ?? JSON.parse(await readFile(pagesFile, 'utf8').catch(() => '[]'))).filter((page: { pathname: string }) => !page.pathname.startsWith('/reference/') || currentRoutes.has(page.pathname))
  for (const doc of catalog.documents) if (!pages.some((page: { pathname: string }) => page.pathname === doc.url)) pages.push({ pathname: doc.url })
  await writeIfChanged(pagesFile, JSON.stringify(pages))
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
