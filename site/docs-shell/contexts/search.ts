/** The event a search trigger dispatches; `components/SearchDialog.svelte` listens for it. */
export const openSearchEvent = 'site-search:open'

/** Search triggers live in independent islands; they open the page's single dialog by event. */
export function openSearch(trigger?: HTMLElement) {
  window.dispatchEvent(new CustomEvent(openSearchEvent, { detail: { trigger } }))
}

/** The search trigger's words in the page's language. */
export function searchLabels(translate: (text: string) => string, locale: string) {
  const searchPlaceholder = translate('Search ⌘ K …')
  return {
    searchPlaceholder,
    /** The placeholder without its shortcut, which triggers show as a key. */
    searchText: searchPlaceholder.replace(/\s*⌘\s*K\s*…?$/u, ''),
    searchLabel: locale === 'tw' ? '搜尋文件' : 'Search documentation',
  }
}
