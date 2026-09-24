import Fuse from 'fuse.js'
import type { SearchPage } from './search-pages'

export interface DocumentationSearchPage extends SearchPage {
  kind?: string
  identifiers?: { text: string; id?: string; detail?: string }[]
  terms?: string[]
}

export interface DocumentationSearchResult {
  page: DocumentationSearchPage
  href: string
  reason: 'Identifier' | 'Title' | 'Syntax' | 'Topic' | 'Content'
  excerpt: string
  score: number
}

const normalize = (text: string) => text.normalize('NFKC').toLocaleLowerCase().trim()

/** One index per loaded locale. Exact public identifiers outrank approximate prose. */
export function createDocumentationSearch(pages: DocumentationSearchPage[]) {
  const enabled = pages.filter(page => !page.disabled)
  const exact = new Map<string, DocumentationSearchResult[]>()
  for (const page of enabled) {
    for (const identifier of page.identifiers ?? []) {
      const key = normalize(identifier.text)
      const items = exact.get(key) ?? []
      if (!items.some(item => item.page.url === page.url)) items.push({ page, href: page.url + (identifier.id ? `#${identifier.id}` : ''), reason: 'Identifier', excerpt: identifier.detail || identifier.text, score: 1000 })
      exact.set(key, items)
    }
  }
  const fuse = new Fuse(enabled, {
    includeScore: true, includeMatches: true, threshold: .35, ignoreLocation: true,
    keys: [{ name: 'title', weight: 4 }, { name: 'identifiers.text', weight: 4 }, { name: 'terms', weight: 3 }, { name: 'description', weight: 2 }, { name: 'nodes.text', weight: 1 }]
  })
  return (query: string, limit = 40): DocumentationSearchResult[] => {
    const needle = normalize(query)
    if (!needle) return []
    if (exact.has(needle)) return exact.get(needle)!.slice(0, limit)
    const results = new Map<string, DocumentationSearchResult>()
    for (const page of enabled) {
      const identifier = page.identifiers?.find(item => normalize(item.text) === needle)
      const syntax = page.nodes.find(node => node.tag === 'code' && normalize(node.text).includes(needle))
      const title = normalize(page.title) === needle
      const topic = page.terms?.some(term => normalize(term) === needle)
      if (!identifier && !syntax && !title && !topic) continue
      const node = identifier ?? syntax
      const id = node?.id
      results.set(page.url, {
        page, href: page.url + (id ? `#${id}` : ''),
        reason: identifier ? 'Identifier' : title ? 'Title' : topic ? 'Topic' : 'Syntax',
        excerpt: identifier?.detail || identifier?.text || (title || topic ? page.description : syntax?.text) || page.description,
        score: identifier ? 1000 : title ? 950 : topic ? 850 : 750
      })
    }
    const approximate = [...results.values()].some(result => result.reason === 'Identifier') ? [] : fuse.search(query, { limit: limit * 2 })
    for (const match of approximate) {
      const page = match.item
      if (results.has(page.url)) continue
      const nodeMatch = match.matches?.find(match => match.key === 'nodes.text')
      const index = nodeMatch?.refIndex ?? -1
      const node = page.nodes[index]
      const anchor = node?.id ?? page.nodes.slice(0, index).reverse().find(node => node.id)?.id
      results.set(page.url, { page, href: page.url + (anchor ? `#${anchor}` : ''), reason: 'Content', excerpt: node?.text || page.description, score: 500 - (match.score ?? 1) * 100 })
    }
    return [...results.values()].sort((a, b) => b.score - a.score || a.page.title.localeCompare(b.page.title)).slice(0, limit)
  }
}
