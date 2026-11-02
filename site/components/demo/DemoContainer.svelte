<script lang="ts">
  import '~/site/styles/system/specimens.css'
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import Demo, { type DemoNode } from './Demo.svelte'

  /** One tray whose tools change a real wrapper's width; children own their query container and layout. */
  let { children, title, caption, maxWidth = 720, ...props }: Omit<HTMLAttributes<HTMLElement>, 'title' | 'style' | 'children'> & {
    children?: Snippet, title: string, caption?: DemoNode, maxWidth?: number
  } = $props()
  let width = $state<number>()
  let measured = $state(480)
  let minimumWidth = $state(240)
  let ready = $state(false)
  let element = $state<HTMLDivElement>()
  const id = $props.id()
  $effect(() => {
    if (!element) return
    const target = element
    const stage = target.parentElement!
    const limit = maxWidth
    const observer = new ResizeObserver(() => {
      measured = Math.round(target.getBoundingClientRect().width)
      const style = getComputedStyle(stage)
      const available = stage.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)
      minimumWidth = Math.min(240, Math.round(available), limit)
      ready = true
    })
    observer.observe(target)
    observer.observe(stage)
    return () => observer.disconnect()
  })
  const value = $derived(width ?? Math.min(measured, maxWidth))
  const range = $derived(Math.max(1, maxWidth - minimumWidth))
</script>

{#snippet controls()}
  <label class="ui-label" data-case="as-is" for={id}>Container</label>
  <input {id} class="ui-range" type="range" min={minimumWidth} max={maxWidth} step="1" disabled={!ready} {value}
    style:--value={`${((value - minimumWidth) / range) * 100}%`} style:width="128px" style:max-width="100%"
    oninput={event => { width = Number(event.currentTarget.value) }} />
  <button type="button" class="ui-button" data-size="sm" disabled={!ready} onclick={() => { width = undefined }}>Fit</button>
  <output class="ui-label" data-case="as-is">{ready ? `${measured} px · viewport unchanged` : 'Measuring container…'}</output>
{/snippet}

<Demo {...props} {title} {caption} padding="sm" data-ready={ready} {controls}>
  <div bind:this={element} data-demo-container="" style:width={width ? `${width}px` : `min(100%, ${maxWidth}px)`} style:max-width="100%">{@render children?.()}</div>
</Demo>
