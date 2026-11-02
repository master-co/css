<script lang="ts">
  import '~/site/styles/system/specimens.css'
  import type { Snippet } from 'svelte'

  /** A dedicated measurement wrapper, never inserted between layout items and their parent. */
  let { children, label = 'Bounds' }: { children?: Snippet, label?: string } = $props()
  let element = $state<HTMLDivElement>()
  let size = $state<{ width: number, height: number }>()
  $effect(() => {
    if (!element) return
    const target = element
    const observer = new ResizeObserver(() => {
      const bounds = target.getBoundingClientRect()
      size = { width: Math.round(bounds.width), height: Math.round(bounds.height) }
    })
    observer.observe(target)
    return () => observer.disconnect()
  })
</script>

<div class="ui-measure">
  <div class="ui-measure-head">
    <span>{label}</span>
    <output aria-label={`${label} dimensions`}>{size ? `${size.width} × ${size.height} px` : 'Measuring…'}</output>
  </div>
  <div class="ui-measure-rule" aria-hidden="true"></div>
  <div bind:this={element}>{@render children?.()}</div>
</div>
