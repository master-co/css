import FastGlob from 'fast-glob'
import Slugger from 'github-slugger'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { mdxjsEsm } from 'micromark-extension-mdxjs-esm'
import { mdxjsEsmFromMarkdown } from 'mdast-util-mdxjs-esm'
import * as acorn from 'acorn'
import resolveHeading from './resolve-heading.js'
import { localizePathname, type LocalePrefixMode } from './i18n-pathname.js'

const DEFAULT_METADATA_GLOB = './app/[locale]/**/*metadata.ts'

export interface SearchNode {
  id?: string
  tag?: string
  text: string
}

export interface SearchPage {
  category?: string
  description: string
  disabled?: boolean
  nodes: SearchNode[]
  title: string
  url: string
}

export interface SearchPageEntry {
  content?: string
  localizedContent?: Record<string, string>
  metadata: Record<string, any>
  metadataPath?: string
}

export interface LoadSearchPageEntriesOptions {
  cwd?: string
  metadataGlob?: string
}

export interface CreateSearchPageOptions {
  defaultLocale: string
  entry: SearchPageEntry
  locale: string
  translate?: Translate
}

export interface GenerateSearchPagesOptions extends LoadSearchPageEntriesOptions {
  defaultLocale: string
  dictionariesDir?: string
  locales: string[]
  outDir?: string
}

type Translate = (text: string) => string

interface MdxNode {
  children?: MdxNode[]
  depth?: number
  type: string
  value?: string
}

export async function generateSearchPages({
  cwd = process.cwd(),
  defaultLocale,
  dictionariesDir = resolve(cwd, 'public/dictionaries'),
  locales,
  metadataGlob,
  outDir = resolve(cwd, 'public/search')
}: GenerateSearchPagesOptions) {
  const entries = await loadSearchPageEntries({ cwd, metadataGlob })
  mkdirSync(outDir, { recursive: true })

  for (const locale of locales) {
    const translations = loadDictionaryTranslations(dictionariesDir, locale)
    const translate = createDictionaryTranslate(translations)
    const pages = entries
      .map((entry) => createSearchPage({ defaultLocale, entry, locale, translate }))
      .sort((a, b) => a.url.localeCompare(b.url))
    const filename = resolve(outDir, `${locale}.json`)
    writeFileSync(filename, JSON.stringify(pages))
    console.log(`產生 ${filename} (${pages.length} search pages)`)
  }
}

export async function loadSearchPageEntries({
  cwd = process.cwd(),
  metadataGlob = DEFAULT_METADATA_GLOB
}: LoadSearchPageEntriesOptions = {}): Promise<SearchPageEntry[]> {
  const metadataPaths = FastGlob.sync(metadataGlob, { cwd })
    .filter((metadataPath) => existsSync(resolve(cwd, dirname(metadataPath), 'page.tsx')))
    .sort()

  return await Promise.all(metadataPaths.map(async (metadataPath) => {
    const metadataModule = await import(pathToFileURL(resolve(cwd, metadataPath)).href)
    const contentPath = resolve(cwd, dirname(metadataPath), 'content.mdx')
    const contentDir = resolve(cwd, dirname(metadataPath))
    return {
      content: existsSync(contentPath) ? readFileSync(contentPath, 'utf8') : undefined,
      localizedContent: loadLocalizedContent(contentDir),
      metadata: metadataModule.default,
      metadataPath
    }
  }))
}

export function createSearchPage({
  defaultLocale,
  entry,
  locale,
  translate = (text) => text
}: CreateSearchPageOptions): SearchPage {
  const { metadata } = entry
  const title = translate(resolveMetadataString(metadata.title))
  const description = translate(resolveMetadataString(metadata.description))
  const category = translate(resolveMetadataString(metadata.category))
  const content = entry.localizedContent?.[locale] ?? entry.content
  const page: SearchPage = {
    category,
    description,
    disabled: Boolean(metadata.disabled),
    nodes: content ? extractSearchNodesFromMdx(content) : [],
    title,
    url: createLocalizedPathname(metadata.pathname, locale, defaultLocale)
  }

  return page
}

function loadLocalizedContent(contentDir: string): Record<string, string> {
  const localizedContent: Record<string, string> = {}
  const entries = FastGlob.sync('content.*.mdx', { cwd: contentDir })
  for (const entry of entries) {
    const match = entry.match(/^content\.([^.]+)\.mdx$/)
    if (!match) continue
    localizedContent[match[1]] = readFileSync(resolve(contentDir, entry), 'utf8')
  }
  return localizedContent
}

export function createDictionaryTranslate(translations: Record<string, string>): Translate {
  return (text) => translations[text || ''] || text
}

export function loadDictionaryTranslations(dictionariesDir: string, locale: string): Record<string, string> {
  const filename = resolve(dictionariesDir, `${locale}.json`)
  if (!existsSync(filename)) return {}
  return JSON.parse(readFileSync(filename, 'utf8')) as Record<string, string>
}

export function createLocalizedPathname(pathname: string, locale: string, defaultLocale: string, localePrefixMode: LocalePrefixMode = 'canonical') {
  const normalizedPathname = pathname.startsWith('/') ? pathname : `/${pathname}`
  return localizePathname(normalizedPathname, {
    defaultLocale,
    locale,
    locales: [defaultLocale, locale],
    localePrefixMode
  })
}

export function extractSearchNodesFromMdx(source: string): SearchNode[] {
  const tree = fromMarkdown(source, {
    extensions: [mdxjsEsm({ acorn, addResult: true })],
    mdastExtensions: [mdxjsEsmFromMarkdown()]
  }) as MdxNode
  const nodes: SearchNode[] = []
  const slugger = new Slugger()
  appendSearchNodes(tree.children ?? [], nodes, slugger)
  return nodes
}

function appendSearchNodes(children: MdxNode[], nodes: SearchNode[], slugger: Slugger) {
  for (const child of children) {
    appendSearchNode(child, nodes, slugger)
  }
}

function appendSearchNode(node: MdxNode, nodes: SearchNode[], slugger: Slugger) {
  switch (node.type) {
    case 'heading':
      appendHeadingSearchNode(node, nodes, slugger)
      return
    case 'paragraph':
      appendTextSearchNode(nodes, collectText(node), 'p')
      return
    case 'code':
      appendTextSearchNode(nodes, node.value ?? '', 'code')
      return
    case 'list':
      for (const child of node.children ?? []) {
        appendTextSearchNode(nodes, collectText(child), 'li')
      }
      return
    case 'blockquote':
      appendSearchNodes(node.children ?? [], nodes, slugger)
      return
    case 'mdxjsEsm':
    case 'html':
    case 'break':
    case 'thematicBreak':
      return
    default:
      if (node.children?.length) {
        appendSearchNodes(node.children, nodes, slugger)
      }
  }
}

function appendHeadingSearchNode(node: MdxNode, nodes: SearchNode[], slugger: Slugger) {
  const text = normalizeSearchText((node.children ?? []).filter(child => child.type === 'text' || child.type === 'inlineCode').map(child => child.value).join(' '))
  if (!text) return

  const tag = node.depth ? `h${node.depth}` : 'h'
  if (node.depth === 2 || node.depth === 3) {
    const resolved = resolveHeading(text, slugger.slug(text))
    appendTextSearchNode(nodes, resolved.title, tag, resolved.id)
    return
  }

  appendTextSearchNode(nodes, text, tag)
}

function appendTextSearchNode(nodes: SearchNode[], text: string, tag: string, id?: string) {
  const normalizedText = normalizeSearchText(text)
  if (!normalizedText) return
  nodes.push({
    ...(id ? { id } : {}),
    tag,
    text: normalizedText
  })
}

function collectText(node: MdxNode): string {
  switch (node.type) {
    case 'text':
    case 'inlineCode':
    case 'code':
      return node.value ?? ''
    case 'html':
    case 'mdxjsEsm':
      return ''
    default:
      return node.children?.map(collectText).join('') ?? ''
  }
}

function normalizeSearchText(text: string) {
  return text.replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
}

function resolveMetadataString(value: any): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (typeof value === 'object') {
    if ('absolute' in value) return resolveMetadataString(value.absolute)
    if ('default' in value) return resolveMetadataString(value.default)
  }
  return String(value)
}
