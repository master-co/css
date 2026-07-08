import { readFile, writeFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { resolvePublicEnv } from '../utils/public-env.js'

const DEFAULT_LOCALE = 'en'
const SITE_URL = resolvePublicEnv().NEXT_PUBLIC_URL
const PROJECT_NAME = 'Master CSS'
const PROJECT_DESC =
  'A CSS language and framework for rapidly building beautiful websites and design systems with rule-based CSS-in-class.'

export type Page = {
  /** Filesystem path of the .mdx file. */
  file: string
  /** Top-level URL section, e.g. "guide". */
  section: string
  /** Public URL path, e.g. "/en/guide/colors". */
  url: string
  /** Display title from metadata, first H1/H2, or last route segment. */
  title: string
  /** Optional link note from metadata.description. */
  description?: string
  /** LLM-oriented Markdown body. */
  body: string
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

/** Convert filesystem path under app/[locale]/ into a public URL path. */
export function pageUrl(relPath: string, locale = DEFAULT_LOCALE): string {
  const dir = normalizeRoutePath(relPath)
  return `/${locale}${dir ? '/' + dir : ''}`
}

export function topSection(relPath: string): string {
  return normalizeRoutePath(relPath).split('/')[0] ?? ''
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

export function renderLlmsIndex(pages: Page[], siteUrl = SITE_URL): string {
  const bySection = new Map<string, Page[]>()
  for (const p of pages) {
    if (!bySection.has(p.section)) bySection.set(p.section, [])
    bySection.get(p.section)!.push(p)
  }
  const sortedSections = [...bySection.keys()].sort()

  const lines: string[] = []
  lines.push(`# ${PROJECT_NAME}`, '')
  lines.push(`> ${PROJECT_DESC}`, '')
  for (const sec of sortedSections) {
    const items = bySection.get(sec)!.sort((a, b) => a.url.localeCompare(b.url))
    lines.push(`## ${sectionTitle(sec)}`)
    for (const p of items) {
      const note = p.description ? `: ${p.description}` : ''
      lines.push(`- [${p.title}](${siteUrl}${p.url})${note}`)
    }
    lines.push('')
  }
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n'
}

export function renderLlmsFull(pages: Page[], siteUrl = SITE_URL): string {
  const sorted = [...pages].sort((a, b) => a.url.localeCompare(b.url))
  const out: string[] = [`# ${PROJECT_NAME}`, '', `> ${PROJECT_DESC}`, '']
  for (const p of sorted) {
    out.push('---', '')
    out.push(`# ${p.title}`, '')
    out.push(`Source: ${siteUrl}${p.url}`, '')
    if (p.description) out.push(`Summary: ${p.description}`, '')
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
      if (e.isDirectory()) await walk(full)
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

export async function loadPages(localeRoot: string): Promise<Page[]> {
  const files = await listMdx(localeRoot)
  const pages: Page[] = []
  for (const file of files) {
    const rel = path.relative(localeRoot, file).split(path.sep).join('/')
    const [rawBody, metadata] = await Promise.all([
      readFile(file, 'utf8'),
      loadMetadata(file)
    ])
    const segments = normalizeRoutePath(rel).split('/')
    const lastSegment = segments[segments.length - 1] ?? ''
    pages.push({
      file,
      section: topSection(rel),
      url: pageUrl(rel),
      title: metadataTitle(metadata.title) || deriveTitle(rawBody, lastSegment),
      description: metadata.description,
      body: cleanMdx(rawBody)
    })
  }
  return pages
}

export async function generate(siteRoot: string): Promise<{ index: string; full: string }> {
  const localeRoot = path.join(siteRoot, 'app', `[${'locale'}]`)
  const pages = await loadPages(localeRoot)
  const index = renderLlmsIndex(pages)
  const full = renderLlmsFull(pages)
  const publicDir = path.join(siteRoot, 'public')
  await writeFile(path.join(publicDir, 'llms.txt'), index, 'utf8')
  await writeFile(path.join(publicDir, 'llms-full.txt'), full, 'utf8')
  return { index, full }
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
