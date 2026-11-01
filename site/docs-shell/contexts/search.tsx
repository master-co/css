'use client'

import '~/site/styles/docs-shell/documentation-search.css'
import Link from '../components/Link'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from './i18n'
import { useLocale } from './locale'
import { createDocumentationSearch, type DocumentationSearchPage } from '../utils/documentation-search'
import { IconArrowDown, IconArrowUp, IconCornerDownLeft, IconSearch, IconX } from '@tabler/icons-react'
import { isInteractOutside } from '../utils/isInteractOutside'
import { createPortal } from 'react-dom'

const cache: Record<string, Promise<DocumentationSearchPage[]>> = {}
const openEvent = 'site-search:open'

async function loadPages(locale: string) {
  cache[locale] ??= fetch(`/search/${encodeURIComponent(locale)}.json`).then(response => {
    if (!response.ok) throw new Error(`Search unavailable (${response.status})`)
    return response.json()
  }).catch(error => { delete cache[locale]; throw error })
  return cache[locale]
}

/** Search triggers live in independent islands; they open the page's single dialog by event. */
export const useSearch = () => {
  const $ = useTranslation()
  const locale = useLocale()
  const searchPlaceholder = $('Search ⌘ K …')
  return {
    open: (trigger?: HTMLElement) => window.dispatchEvent(new CustomEvent(openEvent, { detail: { trigger } })),
    searchPlaceholder,
    /** The placeholder without its shortcut, which triggers show as a key. */
    searchText: searchPlaceholder.replace(/\s*⌘\s*K\s*…?$/u, ''),
    searchLabel: locale === 'tw' ? '搜尋文件' : 'Search documentation',
  }
}

export default function SearchDialog() {
  const $ = useTranslation()
  const locale = useLocale()
  const tw = locale === 'tw'
  const [opened, setOpened] = useState(false)
  const [query, setQuery] = useState('')
  const [pages, setPages] = useState<DocumentationSearchPage[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [retry, setRetry] = useState(0)
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
  const open = useCallback((event?: Event) => {
    const trigger = (event as CustomEvent<{ trigger?: HTMLElement }> | undefined)?.detail?.trigger
    returnFocus.current = trigger instanceof HTMLElement ? trigger : document.activeElement as HTMLElement
    setOpened(true)
  }, [])
  useEffect(() => {
    if (!opened) return
    let active = true
    setLoading(true)
    setError('')
    loadPages(locale).then(data => {
      if (active) { setPages(data); setLoading(false) }
    }, error => {
      if (active) { setError(error.message); setLoading(false) }
    })
    return () => { active = false }
  }, [locale, opened, retry])
  useLayoutEffect(() => {
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
    window.addEventListener(openEvent, open)
    return () => window.removeEventListener(openEvent, open)
  }, [open])
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
  return <>
    {opened && createPortal(<dialog ref={dialog} className="ui-dialog" data-variant="search" aria-label={tw ? '搜尋文件' : 'Search documentation'} onCancel={close}>
      <div className="ui-dialog-search">
        <IconSearch size={18} stroke={1.5} aria-hidden="true" />
        <input ref={input} type="search" role="combobox" aria-autocomplete="list" aria-expanded={Boolean(query)} value={query} autoComplete="off" spellCheck={false} placeholder={tw ? '搜尋文件…' : 'Search documentation…'} aria-label={tw ? '搜尋文件' : 'Search documentation'} aria-controls="documentation-search-results" aria-activedescendant={results[selected] ? `documentation-result-${selected}` : undefined}
          onChange={event => selectQuery(event.target.value)}
          onKeyDown={event => {
            if (event.nativeEvent.isComposing || event.keyCode === 229) return
            if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); return }
            if (event.key === 'Enter' && results.length) { event.preventDefault(); document.getElementById(`documentation-result-${selected}`)?.click() }
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault()
              const next = Math.max(0, Math.min(results.length - 1, selected + (event.key === 'ArrowDown' ? 1 : -1)))
              setSelected(next)
              document.getElementById(`documentation-result-${next}`)?.scrollIntoView({ block: 'nearest' })
            }
          }} />
        {query && <button type="button" className="ui-button" data-variant="quiet" data-shape="icon" data-size="sm" onClick={() => selectQuery('')} aria-label={tw ? '清除搜尋' : 'Clear search'}><IconX size={16} stroke={1.5} aria-hidden="true" /></button>}
        <button type="button" className="ui-button ui-dialog-close" data-variant="quiet" data-size="sm" onClick={close} aria-label={tw ? '關閉搜尋' : 'Close search'}><span className="ui-kbd">esc</span><span>{tw ? '取消' : 'Cancel'}</span></button>
      </div>
      <div className="ui-dialog-body" ref={scroll}>
        <p className="ui-dialog-status" role="status">{loading ? (tw ? '正在載入文件…' : 'Loading documentation…') : error ? (tw ? '搜尋暫時無法載入。' : 'Search could not load.') : query ? `${results.length === 40 ? (tw ? '前 ' : 'Top ') : ''}${results.length} ${tw ? '筆結果' : results.length === 1 ? 'result' : 'results'}` : (tw ? '依名稱、別名或 CSS 屬性查找' : 'Find a name, alias or CSS property')}</p>
        {error && <div className="ui-dialog-note"><p>{tw ? '請檢查連線，再試一次。' : 'Check your connection and try again.'}</p><button type="button" className="ui-button" data-size="sm" onClick={() => { setRetry(value => value + 1); input.current?.focus() }}>{tw ? '再試一次' : 'Try again'}</button></div>}
        {!query && !error && !loading && <div className="ui-dialog-note">
          <p>{tw ? '試試看' : 'Try searching'}</p>
          {['padding', 'padding-inline-start:', 'fg-red:hover@sm'].map(value => <button type="button" className="ui-button" data-size="sm" key={value} onClick={() => selectQuery(value)}><code>{value}</code><IconCornerDownLeft size={14} stroke={1.5} aria-hidden="true" /></button>)}
        </div>}
        {query && !results.length && !error && !loading && <div className="ui-dialog-note" data-align="center"><IconSearch size={24} stroke={1.25} aria-hidden="true" /><b>{tw ? '找不到相符的文件' : 'No matching documents'}</b><p>{tw ? '試試屬性全名、token 名稱或其他關鍵字。' : 'Try a property name, a token name or a different keyword.'}</p></div>}
        <ol id="documentation-search-results" className="ui-results" role="listbox" aria-label={tw ? '搜尋結果' : 'Search results'} aria-busy={loading}>
          {!error && results.map((result, index) => <li key={result.page.url} role="presentation">
            <Link id={`documentation-result-${index}`} role="option" tabIndex={-1} aria-selected={selected === index} href={result.href} onClick={close} onPointerMove={() => setSelected(index)}>
              <small>{$(result.page.category ?? '')} · {kinds[result.page.kind ?? ''] ?? (result.page.url.includes('/guide') ? 'Guide' : 'Page')} · {reasons?.[result.reason] ?? result.reason}</small>
              <b>{result.page.title}</b>
              <span>{excerpt(result.excerpt, query)}</span>
            </Link>
          </li>)}
        </ol>
      </div>
      <div className="ui-dialog-foot" aria-hidden="true"><span><span className="ui-kbd"><IconArrowUp size={12} /></span><span className="ui-kbd"><IconArrowDown size={12} /></span>{tw ? '選擇' : 'Navigate'}</span><span><span className="ui-kbd"><IconCornerDownLeft size={12} /></span>{tw ? '開啟' : 'Open'}</span><span>{tw ? '文件搜尋' : 'Documentation'}</span></div>
    </dialog>, document.body)}
  </>
}

function excerpt(text: string, query: string) {
  const index = text.toLowerCase().indexOf(query.toLowerCase())
  const start = Math.max(0, index - 45)
  const value = text.slice(start, start + 220)
  const offset = value.toLowerCase().indexOf(query.toLowerCase())
  return <>{start > 0 ? '…' : ''}{offset < 0 ? value : <>{value.slice(0, offset)}<mark>{value.slice(offset, offset + query.length)}</mark>{value.slice(offset + query.length)}</>}{start + 220 < text.length ? '…' : ''}</>
}

