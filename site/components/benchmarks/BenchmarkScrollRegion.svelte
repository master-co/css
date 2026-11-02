<script lang="ts">
  import '~/site/styles/system/data.css'
  import type { Snippet } from 'svelte'

  let { title, children }: { title: string; children?: Snippet } = $props()
  const descriptionId = $props.id()

  /** Mobile WebKit does not consistently scroll a focused div with arrow keys. */
  function scrollWithKeyboard(event: KeyboardEvent & { currentTarget: HTMLDivElement }) {
    if (event.target !== event.currentTarget || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
    const region = event.currentTarget
    const horizontal = event.key === 'ArrowLeft' || event.key === 'ArrowRight'
    const vertical = event.key === 'ArrowUp' || event.key === 'ArrowDown'
    if (!horizontal && !vertical) return
    if (horizontal ? region.scrollWidth <= region.clientWidth : region.scrollHeight <= region.clientHeight) return
    const step = event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -40 : 40
    event.preventDefault()
    region.scrollBy({ left: horizontal ? step : 0, top: vertical ? step : 0, behavior: 'instant' })
  }
</script>

<!-- Scroll regions need a tab stop; arrow keys operate this region without intercepting children. -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
<div class="ui-table" data-density="compact" role="region" aria-label={title} aria-describedby={descriptionId} tabindex="0" onkeydown={scrollWithKeyboard}>
  <span class="sr-only" id={descriptionId}>Use arrow keys to scroll the table.</span>
  {@render children?.()}
</div>
