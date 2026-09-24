'use client'

import Link from '../components/Link'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from './i18n'
import { useLocale } from './locale'
import { createDocumentationSearch, type DocumentationSearchPage } from '../utils/documentation-search'
import { IconArrowDown, IconArrowUp, IconCornerDownLeft, IconFileText, IconHash, IconSearch, IconX } from '@tabler/icons-react'
import { isInteractOutside } from '../utils/isInteractOutside'
import { createPortal } from 'react-dom'

const cache: Record<string, Promise<DocumentationSearchPage[]>> = {}
const SearchContext = createContext<any>(null)

async function loadPages(locale: string) {
  cache[locale] ??= fetch(`/search/${encodeURIComponent(locale)}.json`).then(response => {
    if (!response.ok) throw new Error(`Search unavailable (${response.status})`)
    return response.json()
  }).catch(error => { delete cache[locale]; throw error })
  return cache[locale]
}

export const useSearch = () => {
  const value = useContext(SearchContext)
  if (!value) throw new Error('useSearch must be used within a SearchProvider')
  return value
}

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const $ = useTranslation()
  const locale = useLocale()
  const tw = locale === 'tw'
  const [opened, setOpened] = useState(false)
  const [query, setQuery] = useState('')
  const [pages, setPages] = useState<DocumentationSearchPage[]>([])
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(0)
  const dialog = useRef<HTMLDialogElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const scroll = useRef<HTMLDivElement>(null)
  const scrollTop = useRef(0)
  const returnFocus = useRef<HTMLElement | null>(null)
  const search = useMemo(() => createDocumentationSearch(pages), [pages])
  const results = useMemo(() => search(query), [search, query])
  const selectQuery = (value: string) => {
    setQuery(value)
    setSelected(0)
    scrollTop.current = 0
    if (scroll.current) scroll.current.scrollTop = 0
    input.current?.focus()
  }
  const close = useCallback(() => {
    scrollTop.current = scroll.current?.scrollTop ?? 0
    dialog.current?.close()
    setOpened(false)
    returnFocus.current?.focus()
  }, [])
  const open = useCallback(() => {
    returnFocus.current = document.activeElement as HTMLElement
    setOpened(true)
  }, [])
  useEffect(() => {
    let active = true
    loadPages(locale).then(data => { if (active) { setPages(data); setError('') } }, error => { if (active) setError(error.message) })
    return () => { active = false }
  }, [locale, opened])
  useEffect(() => {
    if (opened) {
      dialog.current?.showModal()
      input.current?.focus()
      if (scroll.current) scroll.current.scrollTop = scrollTop.current
    }
  }, [opened])
  useEffect(() => {
    const element = dialog.current
    if (!opened || !element) return
    const closeOnBackdropClick = (event: MouseEvent) => {
      if (event.target === element && isInteractOutside(element, event)) close()
    }
    element.addEventListener('click', closeOnBackdropClick)
    return () => element.removeEventListener('click', closeOnBackdropClick)
  }, [opened, close])
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); opened ? close() : open() }
    }
    window.addEventListener('keydown', shortcut)
    return () => window.removeEventListener('keydown', shortcut)
  }, [opened, close, open])
  const reasons = tw ? { Identifier: '識別字', Title: '名稱', Syntax: '語法與範例', Topic: '主題', Content: '內文' } : undefined
  const kinds: Record<string, string> = tw
    ? { utility: 'Utility', rule: '規則', tokens: 'Tokens', directive: '指令', tool: '工具', package: 'API' }
    : { utility: 'Utility', rule: 'Rule', tokens: 'Tokens', directive: 'Directive', tool: 'Tool', package: 'API' }
  return <SearchContext.Provider value={{ open, close, searchPlaceholder: $('Search ⌘ K …') }}>
    {children}
    {opened && createPortal(<dialog ref={dialog} className="documentation-search" aria-label={tw ? '搜尋文件' : 'Search documentation'} onCancel={close}>
      <div className="documentation-search-input">
        <IconSearch size={22} stroke={1.6} aria-hidden="true" />
        <input ref={input} type="search" value={query} autoComplete="off" spellCheck={false} placeholder={tw ? '搜尋文件…' : 'Search documentation…'} aria-label={tw ? '搜尋文件' : 'Search documentation'} aria-controls="documentation-search-results" aria-activedescendant={results[selected] ? `documentation-result-${selected}` : undefined}
          onChange={event => selectQuery(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); return }
            if (event.key === 'Enter' && results.length) { event.preventDefault(); document.getElementById(`documentation-result-${selected}`)?.click() }
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault()
              const next = Math.max(0, Math.min(results.length - 1, selected + (event.key === 'ArrowDown' ? 1 : -1)))
              setSelected(next)
              document.getElementById(`documentation-result-${next}`)?.scrollIntoView({ block: 'nearest' })
            }
          }} />
        {query && <button className="documentation-search-clear" onClick={() => selectQuery('')} aria-label={tw ? '清除搜尋' : 'Clear search'}><IconX size={16} aria-hidden="true" /></button>}
        <button className="documentation-search-close" onClick={close} aria-label={tw ? '關閉搜尋' : 'Close search'}><kbd>esc</kbd><span>{tw ? '取消' : 'Cancel'}</span></button>
      </div>
      <div className="documentation-search-results" ref={scroll}>
        <p className="documentation-search-status" role="status">{error ? (tw ? '搜尋暫時無法載入；重新開啟以重試。' : 'Search could not load. Reopen to retry.') : query ? `${results.length === 40 ? (tw ? '前 ' : 'Top ') : ''}${results.length} ${tw ? '筆結果' : results.length === 1 ? 'result' : 'results'}` : (tw ? '依名稱、別名或 CSS 屬性查找' : 'Find a name, alias or CSS property')}</p>
        {!query && !error && <div className="documentation-search-suggestions">
          <span>{tw ? '試試看' : 'Try searching'}</span>
          {['padding', 'pxs:', 'fg-red:hover@sm'].map(value => <button key={value} onClick={() => selectQuery(value)}><code>{value}</code><IconCornerDownLeft size={14} aria-hidden="true" /></button>)}
        </div>}
        {query && !results.length && !error && <div className="documentation-search-empty"><IconSearch size={28} stroke={1.25} aria-hidden="true" /><strong>{tw ? '找不到相符的文件' : 'No matching documents'}</strong><p>{tw ? '試試屬性全名、較短的別名或其他關鍵字。' : 'Try a property name, a shorter alias or a different keyword.'}</p></div>}
        <ol id="documentation-search-results">
          {results.map((result, index) => <li key={result.page.url}>
            <Link id={`documentation-result-${index}`} href={result.href} onClick={close} onPointerMove={() => setSelected(index)} className={selected === index ? 'is-selected' : undefined}>
              <span className="documentation-search-icon">{result.href.includes('#') ? <IconHash size={22} stroke={1.4} aria-hidden="true" /> : <IconFileText size={22} stroke={1.4} aria-hidden="true" />}</span>
              <span className="documentation-search-copy">
                <span className="documentation-search-title"><strong>{result.page.title}</strong><small>{kinds[result.page.kind ?? ''] ?? (result.page.url.includes('/guide') ? 'Guide' : 'Page')}</small></span>
                <span className="documentation-search-excerpt">{excerpt(result.excerpt, query)}</span>
                <span className="documentation-search-context">{$(result.page.category ?? '')} <span aria-hidden="true">·</span> {reasons?.[result.reason] ?? result.reason}</span>
              </span>
              <IconCornerDownLeft className="documentation-search-enter" size={17} stroke={1.5} aria-hidden="true" />
            </Link>
          </li>)}
        </ol>
      </div>
      <div className="documentation-search-footer" aria-hidden="true"><span><kbd><IconArrowUp size={12} /></kbd><kbd><IconArrowDown size={12} /></kbd>{tw ? '選擇' : 'Navigate'}</span><span><kbd><IconCornerDownLeft size={12} /></kbd>{tw ? '開啟' : 'Open'}</span><span>{tw ? 'Guide 與 Reference' : 'Guide & Reference'}</span></div>
    </dialog>, document.body)}
  </SearchContext.Provider>
}

function excerpt(text: string, query: string) {
  const index = text.toLowerCase().indexOf(query.toLowerCase())
  const start = Math.max(0, index - 45)
  const value = text.slice(start, start + 220)
  const offset = value.toLowerCase().indexOf(query.toLowerCase())
  return <>{start > 0 ? '…' : ''}{offset < 0 ? value : <>{value.slice(0, offset)}<mark>{value.slice(offset, offset + query.length)}</mark>{value.slice(offset + query.length)}</>}{start + 220 < text.length ? '…' : ''}</>
}

export default SearchContext
