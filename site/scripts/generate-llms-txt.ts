import { locales } from '@master/internal-site/common/locales.js'
import { readLocalizedDocument } from '@master/internal-site/build/localization.ts'
import { benchmarkContent } from '../utils/benchmark-content'
import { introductionContent } from '../utils/introduction-content'
import { installationGuideContent, installationGuideSlugs } from '../utils/installation-content'
import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { resolvePublicEnv } from '../utils/public-env.js'
import { generateReference, renderDocumentMarkdown, referencePath, localizeReferenceMarkdown } from '../reference/build'
import { guideOverviewMarkdown } from '../utils/guide-overview'
import { localizedGuideCategories, publishedLocalizedDocument } from '../utils/localized-content'
import { writeArticleMarkdownExports } from './article-exports'
import { translateSite } from '../utils/translations'
import sharedTranslations from '@master/internal-site/common/translations.js'
import { referenceOverviewMarkdown } from '../reference/navigation-data'
import { syntaxTutorialContent } from '../utils/syntax-tutorial'
import { foundationGuideContent, foundationGuideSlugs } from '../utils/foundation-content'
import { projectStyleGuideContent, projectStyleGuideSlugs } from '../utils/project-style-content'
import { migrationGuideContent, migrationGuideSlugs } from '../utils/migration-content'
import { deliveryGuideContent, deliveryGuideSlugs } from '../utils/delivery-content'
import { agentGuideContent, agentGuideSlugs } from '../utils/agent-content'
import { toolingGuideContent, toolingGuideSlugs } from '../utils/tooling-content'

const DEFAULT_LOCALE = 'en'
const SITE_URL = resolvePublicEnv().PUBLIC_URL
const PROJECT_NAME = 'Master CSS'
const PROJECT_DESC =
  'A CSS language and framework for rapidly building beautiful websites and design systems with rule-based CSS-in-class.'

export type Page = {
  /** Filesystem path of the .mdx file. */
  file: string
  /** Top-level URL section, e.g. "guide". */
  section: string
  /** Public URL path, e.g. "/guide/colors". */
  url: string
  /** Display title from metadata, first H1/H2, or last route segment. */
  title: string
  /** Optional link note from metadata.description. */
  description?: string
  /** LLM-oriented Markdown body. */
  body: string
  markdownUrl?: string
}

type PageMetadata = {
  title?: string | { absolute?: string; default?: string }
  description?: string
}

const TITLE_FROM_HEADING = /^#{1,2}\s+(.+?)\s*$/m
const HEADING_TRAILING_TAG = /\s*[\[\{][^\]\}]*[\]\}]\s*$/
const ROUTE_GROUP = /^\(.+\)$/
const CODE_FENCE = /(```[\s\S]*?```)/g
const IMPORT_LINE = /^import\s.+$/gm
const JSX_ATTRIBUTE_LINE = /^[ \t]*<\/?[A-Za-z][^`\n]*\b(?:className|src=|width=|height=|style=|key=|alt=|\{)[^`\n]*$/gm
const HTML_TAG_ONLY_LINE = /^[ \t]*<\/?[a-z][\w.:-]*(?:\s+[^`\n<>]*)?>\s*$/gm
const GENERATED_CSS_SUMMARY_LINE = /^[ \t]*<summary>Generated CSS<\/summary>\s*$/gm
const RAW_REQUIRE_LINE = /^\s*\{require\(.+\)\}\s*$/gm
const MDX_COMPONENT_TAG = /<\/?[A-Z][\w.:-]*(?:\s+[^<>]*)?\/?>/g
const JSX_EXPRESSION_LINE = /^\s*\{.*\}\s*$/gm

export function deriveTitle(body: string, fallbackSegment: string): string {
  const m = body.match(TITLE_FROM_HEADING)
  if (m) return m[1].replace(HEADING_TRAILING_TAG, '').trim()
  return fallbackSegment
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ')
}

export function metadataTitle(title: PageMetadata['title']): string | undefined {
  if (typeof title === 'string') return title
  return title?.absolute || title?.default
}

export function normalizeRoutePath(relPath: string): string {
  return relPath
    .replace(/\/content\.mdx$/, '')
    .split('/')
    .filter((segment) => segment && !ROUTE_GROUP.test(segment))
    .join('/')
}

/** Convert filesystem path under content/ into a public URL path. */
export function pageUrl(relPath: string, locale = DEFAULT_LOCALE): string {
  const dir = normalizeRoutePath(relPath)
  return `${locale === DEFAULT_LOCALE ? '' : '/' + locale}${dir ? '/' + dir : ''}` || '/'
}

export function topSection(relPath: string): string {
  return normalizeRoutePath(relPath).split('/')[0] ?? ''
}

/** Localize reader links while leaving executable examples byte-for-byte intact. */
export function localizedMarkdownLinks(markdown: string, locale: string) {
  return localizeReferenceMarkdown(markdown, locale)
}

export function cleanMdx(body: string): string {
  return body
    .split(CODE_FENCE)
    .map((part) => part.startsWith('```') ? part : cleanMdxProse(part))
    .join('')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function cleanMdxProse(body: string): string {
  return body
    .replace(IMPORT_LINE, '')
    .replace(MDX_COMPONENT_TAG, '')
    .replace(JSX_ATTRIBUTE_LINE, '')
    .replace(GENERATED_CSS_SUMMARY_LINE, '')
    .replace(HTML_TAG_ONLY_LINE, '')
    .replace(RAW_REQUIRE_LINE, '')
    .replace(JSX_EXPRESSION_LINE, '')
    .replace(/\s+\[sr-only\]/g, '')
    .replace(/\s+\{\.sr-only\}/g, '')
    .replace(/[ \t]+\n/g, '\n')
}

export function renderLlmsIndex(pages: Page[], siteUrl = SITE_URL, t: (text: string) => string = text => text, locale = DEFAULT_LOCALE): string {
  const bySection = new Map<string, Page[]>()
  for (const p of pages) {
    if (!bySection.has(p.section)) bySection.set(p.section, [])
    bySection.get(p.section)!.push(p)
  }
  const sortedSections = [...bySection.keys()].sort()

  const lines: string[] = []
  lines.push(`# ${PROJECT_NAME}`, '')
  lines.push(`> ${t(PROJECT_DESC)}`, '')
  lines.push(`${t('Reference discovery')}: [${t('structured index')}](${siteUrl}${locale === DEFAULT_LOCALE ? '' : '/' + locale}/reference/index.json). ${t('Individual Reference links below return Markdown with source revision, prerequisites and generated CSS.')}`, '')
  for (const sec of sortedSections) {
    const items = bySection.get(sec)!.sort((a, b) => a.url.localeCompare(b.url))
    lines.push(`## ${sec.split(' / ').map(part => t(sectionTitle(part))).join(' / ')}`)
    for (const p of items) {
      const note = p.description ? `: ${p.description}` : ''
      lines.push(`- [${p.title}](${siteUrl}${p.markdownUrl ?? p.url})${note}`)
    }
    lines.push('')
  }
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n'
}

export function renderLlmsFull(pages: Page[], siteUrl = SITE_URL, t: (text: string) => string = text => text): string {
  const sorted = [...pages].sort((a, b) => a.url.localeCompare(b.url))
  const out: string[] = [`# ${PROJECT_NAME}`, '', `> ${t(PROJECT_DESC)}`, '']
  for (const p of sorted) {
    out.push('---', '')
    out.push(`# ${p.title}`, '')
    out.push(`${t('Source')}: ${siteUrl}${p.url}`, '')
    if (p.description) out.push(`${t('Summary')}: ${p.description}`, '')
    out.push(p.body.trim(), '')
  }
  return out.join('\n').trimEnd() + '\n'
}

function sectionTitle(section: string): string {
  return section
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

async function listMdx(root: string): Promise<string[]> {
  const out: string[] = []
  async function walk(dir: string) {
    const entries = await readdir(dir, { withFileTypes: true })
    for (const e of entries) {
      const full = path.join(dir, e.name)
      if (e.isDirectory() && e.name !== 'drafts') await walk(full)
      else if (e.isFile() && e.name === 'content.mdx') out.push(full)
    }
  }
  await walk(root)
  return out
}

async function loadMetadata(file: string): Promise<PageMetadata> {
  const metadataPath = path.join(path.dirname(file), 'metadata.ts')
  try {
    const mod = await import(pathToFileURL(metadataPath).href)
    return mod.default ?? {}
  } catch {
    return {}
  }
}

export async function loadPages(localeRoot: string, locale = DEFAULT_LOCALE, { skipMissing = false } = {}): Promise<Page[]> {
  const files = await listMdx(localeRoot)
  const pages: Page[] = []
  for (const file of files) {
    const rel = path.relative(localeRoot, file).split(path.sep).join('/')
    const baseMetadata = await loadMetadata(file)
    if ((baseMetadata as any).draft || (baseMetadata as any).disabled) continue
    let document: Awaited<ReturnType<typeof readLocalizedDocument>>
    try {
      const published = await publishedLocalizedDocument(file, locale, baseMetadata)
      if (!published) continue
      document = published
    }
    catch (error) {
      if (skipMissing && (error as Error & { cause?: NodeJS.ErrnoException }).cause?.code === 'ENOENT') continue
      throw error
    }
    const { content: rawBody, metadata, file: localizedFile } = document
    const segments = normalizeRoutePath(rel).split('/')
    const lastSegment = segments[segments.length - 1] ?? ''
    const installationSlug = segments.slice(2).join('/')
    const installation = segments[0] === 'guide' && segments[1] === 'installation' && installationGuideSlugs.includes(installationSlug as typeof installationGuideSlugs[number])
    const foundation = segments[0] === 'guide' && segments.length === 2
      && foundationGuideSlugs.includes(lastSegment as typeof foundationGuideSlugs[number])
    const projectStyle = segments[0] === 'guide' && segments.length === 2
      && projectStyleGuideSlugs.includes(lastSegment as typeof projectStyleGuideSlugs[number])
    const agent = segments[0] === 'guide' && segments.length === 2
      && agentGuideSlugs.includes(lastSegment as typeof agentGuideSlugs[number])
    const tooling = segments[0] === 'guide' && segments.length === 2
      && toolingGuideSlugs.includes(lastSegment as typeof toolingGuideSlugs[number])
    const delivery = segments[0] === 'guide' && segments.length === 2
      && deliveryGuideSlugs.includes(lastSegment as typeof deliveryGuideSlugs[number])
    const migrationSlug = segments.length === 2 ? '' : lastSegment
    const migration = segments[0] === 'guide' && segments[1] === 'migration' && segments.length <= 3
      && migrationGuideSlugs.includes(migrationSlug as typeof migrationGuideSlugs[number])
    pages.push({
      file: localizedFile,
      section: topSection(rel),
      url: pageUrl(rel, locale),
      markdownUrl: `${pageUrl(rel, locale)}.md`,
      title: metadataTitle(metadata.title) || deriveTitle(rawBody, lastSegment),
      description: metadata.description,
      body: normalizeRoutePath(rel) === 'guide'
        ? guideOverviewMarkdown(await localizedGuideCategories(path.resolve(localeRoot, '..'), JSON.parse(await readFile(path.join(localeRoot, '../.categories/guide.json'), 'utf8')), locale, { skipMissing }), text => translateSite(locale, text))
        : normalizeRoutePath(rel) === 'guide/syntax-tutorial'
        ? (await syntaxTutorialContent(path.resolve(localeRoot, '..'), locale)).markdown
        : normalizeRoutePath(rel) === 'benchmarks' ? (await benchmarkContent(path.resolve(localeRoot, '..'), locale)).markdown
        : normalizeRoutePath(rel) === 'guide/introduction' ? (await introductionContent(path.resolve(localeRoot, '..'), locale)).markdown
        : installation ? (await installationGuideContent(path.resolve(localeRoot, '..'), installationSlug, locale)).markdown
        : agent ? (await agentGuideContent(path.resolve(localeRoot, '..'), lastSegment, locale)).markdown
        : tooling ? (await toolingGuideContent(path.resolve(localeRoot, '..'), lastSegment, locale)).markdown
        : delivery ? (await deliveryGuideContent(path.resolve(localeRoot, '..'), lastSegment, locale)).markdown
          : foundation ? (await foundationGuideContent(path.resolve(localeRoot, '..'), lastSegment, locale)).markdown
          : projectStyle ? (await projectStyleGuideContent(path.resolve(localeRoot, '..'), lastSegment, locale)).markdown
            : migration ? (await migrationGuideContent(path.resolve(localeRoot, '..'), migrationSlug, locale)).markdown
              : cleanMdx(rawBody)
    })
  }
  for (const page of pages) page.body = localizedMarkdownLinks(page.body, locale)
  return pages
}

export async function generate(siteRoot: string): Promise<{ index: string; full: string }> {
  await generateReference(siteRoot)
  const published = new Set<string>((JSON.parse(await readFile(path.join(siteRoot, '.pages.json'), 'utf8')) as { pathname: string }[]).map(page => page.pathname))
  const publicDir = path.join(siteRoot, 'public')
  const defaultOutput = { index: '', full: '' }
  for (const locale of locales) {
    const catalogFile = path.join(siteRoot, '.generated', locale === DEFAULT_LOCALE ? 'reference.json' : `reference.${locale}.json`)
    const catalog = JSON.parse(await readFile(catalogFile, 'utf8'))
    const dictionary = { ...sharedTranslations[locale], ...JSON.parse(await readFile(path.join(publicDir, 'dictionaries', `${locale}.json`), 'utf8')) }
    const t = (text: string) => dictionary[text] || text
    const prefix = locale === DEFAULT_LOCALE ? '' : `/${locale}`
    const pages = (await loadPages(path.join(siteRoot, 'content'), locale)).filter(page => page.section !== 'reference'
      && published.has(prefix ? page.url.slice(prefix.length) || '/' : page.url))
    await writeArticleMarkdownExports(publicDir, pages, locale)
    pages.push({ file: 'site/reference/navigation-data.ts', section: 'reference', url: `${prefix}/reference`, markdownUrl: `${prefix}/reference.md`, title: t('Reference'), description: t('The language and tool reference for writing, understanding and reviewing Master CSS.'), body: referenceOverviewMarkdown(catalog.documents, locale) })
    pages.push(...catalog.documents.map((doc: any) => ({
      file: doc.source, section: `reference / ${doc.kind}`, url: referencePath(doc.url, locale), markdownUrl: `${referencePath(doc.url, locale)}.md`,
      title: doc.title, description: doc.description, body: renderDocumentMarkdown(doc, catalog, locale)
    })))
    const index = renderLlmsIndex(pages, SITE_URL, t, locale)
    const full = renderLlmsFull(pages, SITE_URL, t)
    const destination = path.join(publicDir, prefix)
    await mkdir(destination, { recursive: true })
    await writeFile(path.join(destination, 'llms.txt'), index, 'utf8')
    await writeFile(path.join(destination, 'llms-full.txt'), full, 'utf8')
    if (locale === DEFAULT_LOCALE) Object.assign(defaultOutput, { index, full })
  }
  return defaultOutput
}

const isMain = (() => {
  if (typeof process === 'undefined' || !process.argv[1]) return false
  try {
    return path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
  } catch {
    return false
  }
})()

if (isMain) {
  const siteRoot = path.resolve(fileURLToPath(import.meta.url), '..', '..')
  const { index } = await generate(siteRoot)
  const lineCount = index.split('\n').length
  console.log(`[llms.txt] generated index (${lineCount} lines) + full at ${path.join(siteRoot, 'public')}`)
}
