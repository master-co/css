<script lang="ts" module>
  import type { Attachment } from 'svelte/attachments'
  import type { DocumentationSearchPage } from '../utils/documentation-search'

  const cache: Record<string, Promise<DocumentationSearchPage[]>> = {}

  async function loadPages(locale: string) {
    cache[locale] ??= fetch(`/search/${encodeURIComponent(locale)}.json`).then(response => {
      if (!response.ok) throw new Error(`Search unavailable (${response.status})`)
      return response.json()
    }).catch(error => { delete cache[locale]; throw error })
    return cache[locale]
  }

  /** The dialog lives at the end of the body, outside the island that opens it. */
  const portal: Attachment<HTMLElement> = (node) => {
    document.body.append(node)
    return () => node.remove()
  }
</script>

<script lang="ts">
  import '~/site/styles/docs-shell/documentation-search.css'
  import { untrack } from 'svelte'
  import Link from './Link.svelte'
  import { getSite } from '../site'
  import { createDocumentationSearch } from '../utils/documentation-search'
  import { openSearchEvent } from '../contexts/search'
  import IconArrowDown from '@tabler/icons-svelte-runes/icons/arrow-down'
  import IconArrowUp from '@tabler/icons-svelte-runes/icons/arrow-up'
  import IconCornerDownLeft from '@tabler/icons-svelte-runes/icons/corner-down-left'
  import IconSearch from '@tabler/icons-svelte-runes/icons/search'
  import IconX from '@tabler/icons-svelte-runes/icons/x'
  import { isInteractOutside } from '../utils/isInteractOutside'

  /** The page's single search dialog; search triggers in other islands open it by event (`contexts/search`). */
  const { t, locale } = getSite()
  const tw = locale === 'tw'
  let opened = $state(false)
  let query = $state('')
  let pages = $state.raw<DocumentationSearchPage[]>([])
  let error = $state('')
  let loading = $state(false)
  let retry = $state(0)
  let selected = $state(0)
  let dialog = $state<HTMLDialogElement>()
  let input = $state<HTMLInputElement>()
  let scroll = $state<HTMLDivElement>()
  let scrollTop = 0
  let returnFocus: HTMLElement | null = null
  const search = $derived(createDocumentationSearch(pages))
  const results = $derived(search(query))

  function selectQuery(value: string) {
    query = value
    selected = 0
    scrollTop = 0
    if (scroll) scroll.scrollTop = 0
    input?.focus()
  }

  function close() {
    scrollTop = scroll?.scrollTop ?? 0
    dialog?.close()
    opened = false
    returnFocus?.focus()
  }

  function open(event?: Event) {
    const trigger = (event as CustomEvent<{ trigger?: HTMLElement }> | undefined)?.detail?.trigger
    returnFocus = trigger instanceof HTMLElement ? trigger : document.activeElement as HTMLElement
    opened = true
  }

  $effect(() => {
    if (!opened) return
    void retry
    let active = true
    loading = true
    error = ''
    loadPages(locale).then(data => {
      if (active) { pages = data; loading = false }
    }, reason => {
      if (active) { error = reason.message; loading = false }
    })
    return () => { active = false }
  })

  $effect(() => {
    if (opened && dialog) {
      untrack(() => {
        if (!dialog!.open) dialog!.showModal()
        input?.focus()
        if (scroll) scroll.scrollTop = scrollTop
      })
    }
  })

  const closeOnBackdropClick: Attachment<HTMLDialogElement> = (element) => {
    const onclick = (event: MouseEvent) => {
      if (event.target === element && isInteractOutside(element, event)) close()
    }
    element.addEventListener('click', onclick)
    return () => element.removeEventListener('click', onclick)
  }

  $effect(() => {
    window.addEventListener(openSearchEvent, open)
    return () => window.removeEventListener(openSearchEvent, open)
  })

  function shortcut(event: KeyboardEvent) {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); opened ? close() : open() }
  }

  function onkeydown(event: KeyboardEvent) {
    if (event.isComposing || event.keyCode === 229) return
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); return }
    if (event.key === 'Enter' && results.length) { event.preventDefault(); document.getElementById(`documentation-result-${selected}`)?.click() }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const next = Math.max(0, Math.min(results.length - 1, selected + (event.key === 'ArrowDown' ? 1 : -1)))
      selected = next
      document.getElementById(`documentation-result-${next}`)?.scrollIntoView({ block: 'nearest' })
    }
  }

  const reasons: Record<string, string> | undefined = tw ? { Identifier: '識別字', Title: '名稱', Syntax: '語法與範例', Topic: '主題', Content: '內文' } : undefined
  const kinds: Record<string, string> = tw
    ? { utility: 'Utility', rule: '規則', tokens: 'Tokens', directive: '指令', tool: '工具', package: 'API' }
    : { utility: 'Utility', rule: 'Rule', tokens: 'Tokens', directive: 'Directive', tool: 'Tool', package: 'API' }
</script>

<svelte:window onkeydown={shortcut} />

{#snippet excerpt(text: string, query: string)}
  {@const index = text.toLowerCase().indexOf(query.toLowerCase())}
  {@const start = Math.max(0, index - 45)}
  {@const value = text.slice(start, start + 220)}
  {@const offset = value.toLowerCase().indexOf(query.toLowerCase())}
  {start > 0 ? '…' : ''}{#if offset < 0}{value}{:else}{value.slice(0, offset)}<mark>{value.slice(offset, offset + query.length)}</mark>{value.slice(offset + query.length)}{/if}{start + 220 < text.length ? '…' : ''}
{/snippet}

{#if opened}
  <dialog bind:this={dialog} {@attach portal} {@attach closeOnBackdropClick} class="ui-dialog" data-variant="search" aria-label={tw ? '搜尋文件' : 'Search documentation'} oncancel={close}>
    <div class="ui-dialog-search">
      <IconSearch size={18} stroke={1.5} aria-hidden="true" />
      <input bind:this={input} type="search" role="combobox" aria-autocomplete="list" aria-expanded={Boolean(query)} value={query} autocomplete="off" spellcheck={false} placeholder={tw ? '搜尋文件…' : 'Search documentation…'} aria-label={tw ? '搜尋文件' : 'Search documentation'} aria-controls="documentation-search-results" aria-activedescendant={results[selected] ? `documentation-result-${selected}` : undefined}
        oninput={event => selectQuery(event.currentTarget.value)}
        {onkeydown} />
      {#if query}<button type="button" class="ui-button" data-variant="quiet" data-shape="icon" data-size="sm" onclick={() => selectQuery('')} aria-label={tw ? '清除搜尋' : 'Clear search'}><IconX size={16} stroke={1.5} aria-hidden="true" /></button>{/if}
      <button type="button" class="ui-button ui-dialog-close" data-variant="quiet" data-size="sm" onclick={close} aria-label={tw ? '關閉搜尋' : 'Close search'}><span class="ui-kbd">esc</span><span>{tw ? '取消' : 'Cancel'}</span></button>
    </div>
    <div class="ui-dialog-body" bind:this={scroll}>
      <p class="ui-dialog-status" role="status">{loading ? (tw ? '正在載入文件…' : 'Loading documentation…') : error ? (tw ? '搜尋暫時無法載入。' : 'Search could not load.') : query ? `${results.length === 40 ? (tw ? '前 ' : 'Top ') : ''}${results.length} ${tw ? '筆結果' : results.length === 1 ? 'result' : 'results'}` : (tw ? '依名稱、別名或 CSS 屬性查找' : 'Find a name, alias or CSS property')}</p>
      {#if error}<div class="ui-dialog-note"><p>{tw ? '請檢查連線，再試一次。' : 'Check your connection and try again.'}</p><button type="button" class="ui-button" data-size="sm" onclick={() => { retry += 1; input?.focus() }}>{tw ? '再試一次' : 'Try again'}</button></div>{/if}
      {#if !query && !error && !loading}<div class="ui-dialog-note">
        <p>{tw ? '試試看' : 'Try searching'}</p>
        {#each ['padding', 'padding-inline-start:', 'fg-red:hover@sm'] as value (value)}<button type="button" class="ui-button" data-size="sm" onclick={() => selectQuery(value)}><code>{value}</code><IconCornerDownLeft size={14} stroke={1.5} aria-hidden="true" /></button>{/each}
      </div>{/if}
      {#if query && !results.length && !error && !loading}<div class="ui-dialog-note" data-align="center"><IconSearch size={24} stroke={1.25} aria-hidden="true" /><b>{tw ? '找不到相符的文件' : 'No matching documents'}</b><p>{tw ? '試試屬性全名、token 名稱或其他關鍵字。' : 'Try a property name, a token name or a different keyword.'}</p></div>{/if}
      <ol id="documentation-search-results" class="ui-results" role="listbox" aria-label={tw ? '搜尋結果' : 'Search results'} aria-busy={loading}>
        {#if !error}{#each results as result, index (result.page.url)}<li role="presentation">
          <Link id={`documentation-result-${index}`} role="option" tabindex={-1} aria-selected={selected === index} href={result.href} onclick={close} onpointermove={() => { selected = index }}>
            <small>{t(result.page.category ?? '')} · {kinds[result.page.kind ?? ''] ?? (result.page.url.includes('/guide') ? 'Guide' : 'Page')} · {reasons?.[result.reason] ?? result.reason}</small>
            <b>{result.page.title}</b>
            <span>{@render excerpt(result.excerpt, query)}</span>
          </Link>
        </li>{/each}{/if}
      </ol>
    </div>
    <div class="ui-dialog-foot" aria-hidden="true"><span><span class="ui-kbd"><IconArrowUp size={12} /></span><span class="ui-kbd"><IconArrowDown size={12} /></span>{tw ? '選擇' : 'Navigate'}</span><span><span class="ui-kbd"><IconCornerDownLeft size={12} /></span>{tw ? '開啟' : 'Open'}</span><span>{tw ? '文件搜尋' : 'Documentation'}</span></div>
  </dialog>
{/if}
