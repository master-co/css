<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLButtonAttributes } from 'svelte/elements'
  import IconSearch from '@tabler/icons-svelte-runes/icons/search'
  import { openSearch, searchLabels } from '../contexts/search'
  import { getSite } from '../site'

  interface Props extends HTMLButtonAttributes {
    children?: Snippet
  }

  /** Opens the page's search dialog. Without children it renders the search field trigger (`ui-search-trigger`) with its shortcut. */
  let { class: className, children, onclick, type = 'button', ...props }: Props = $props()
  const { t, locale } = getSite()
  const { searchText, searchLabel } = searchLabels(t, locale)

  function handleClick(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) {
    onclick?.(event)
    if (!event.defaultPrevented) openSearch(event.currentTarget)
  }
</script>

<button {...props} {type} class={className} aria-label={props['aria-label'] ?? searchLabel} aria-keyshortcuts="Meta+K Control+K" onclick={handleClick}>
  {#if children}
    {@render children()}
  {:else}
    <IconSearch aria-hidden="true" stroke={1.5} />
    {searchText}
    <span class="ui-kbd" aria-hidden="true">⌘K</span>
  {/if}
</button>
