<script lang="ts">
  import type { Snippet } from 'svelte'
  import { providePageContent, type PageContentItem } from './page-content.svelte'

  interface Props {
    items: PageContentItem[]
    children?: Snippet
  }

  /** Tracks the entry being read for the `PageContentList`s inside it. */
  let { items, children }: Props = $props()
  providePageContent(() => items)
</script>

{@render children?.()}
