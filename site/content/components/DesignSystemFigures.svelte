<script lang="ts">
  import '@master/internal-site/home/bento.css'
  import type { Snippet } from 'svelte'
  import type { PaletteCanvas } from './palette-canvas'

  interface PaletteSwatch {
    id: string
    token: string
    value: string
    wide: boolean
  }

  interface Props {
    /** The server-rendered swatch field: native options that own the colors and accessibility. */
    children: Snippet
    columns: number
    label: string
    summary: string
  }

  /**
   * Client figures for the homepage's Interface styling section: the palette explorer.
   * Native options own the colors and accessibility; the canvas is their measured visual projection.
   */
  let { children, columns, label, summary }: Props = $props()

  let stage = $state<HTMLDivElement>()
  let canvas = $state<HTMLCanvasElement>()
  let renderer: PaletteCanvas | undefined
  let active: HTMLElement | null = null
  let options: HTMLElement[] = []
  let pinnedNow = false
  let swatch = $state<PaletteSwatch>()
  let pinned = $state(false)

  function activate(element: HTMLElement | null, keep: boolean) {
    if (active === element && pinnedNow === keep) return
    active?.removeAttribute('data-active')
    active?.setAttribute('aria-selected', 'false')
    active = element
    pinnedNow = !!element && keep
    pinned = pinnedNow
    renderer?.select(element, pinnedNow)
    if (!element) { swatch = undefined; return }
    element.setAttribute('data-active', '')
    element.setAttribute('aria-selected', 'true')
    swatch = { id: element.id, token: element.dataset.token!, value: element.dataset.value!, wide: element.dataset.gamut === 'P3' }
  }

  function preview(element: HTMLElement | null) {
    if (!pinnedNow && !stage?.matches(':focus-visible')) activate(element, false)
  }

  const choose = (element: HTMLElement) => activate(element, true)

  $effect(() => {
    if (!stage || !canvas) return
    const scene = stage, drawing = canvas
    let disposed = false
    options = [...scene.querySelectorAll<HTMLElement>('[data-token]')]
    // Notifications batch while layout settles; the last entry is the current state.
    const nearby = new IntersectionObserver((entries) => {
      const entry = entries[entries.length - 1]
      if (!entry.isIntersecting) return
      nearby.disconnect()
      void import('./palette-canvas').then(({ mountPaletteCanvas }) => {
        if (disposed) return
        renderer = mountPaletteCanvas(scene, drawing, { preview, choose })
        renderer?.select(active, pinnedNow)
      }).catch(() => {
        // The native color table remains usable if the optional drawing module cannot load.
      })
    }, { rootMargin: '200px 0px' })
    nearby.observe(scene)
    return () => {
      disposed = true
      nearby.disconnect()
      renderer?.dispose()
      renderer = undefined
    }
  })

  function handleKeyDown(event: KeyboardEvent) {
    const list = options
    const index = active ? list.indexOf(active) : -1
    const row = Math.max(0, Math.floor(index / columns)), column = Math.max(0, index % columns)
    const rows = Math.ceil(list.length / columns)
    const next = ({
      ArrowLeft: index < 0 ? 0 : row * columns + Math.max(0, column - 1),
      ArrowRight: index < 0 ? 0 : row * columns + Math.min(columns - 1, column + 1),
      ArrowUp: index < 0 ? 0 : Math.max(0, row - 1) * columns + column,
      ArrowDown: index < 0 ? 0 : Math.min(rows - 1, row + 1) * columns + column,
      PageUp: Math.max(0, row - 3) * columns + column,
      PageDown: Math.min(rows - 1, row + 3) * columns + column,
      Home: event.ctrlKey || event.metaKey ? 0 : row * columns,
      End: event.ctrlKey || event.metaKey ? list.length - 1 : row * columns + columns - 1,
      Enter: Math.max(0, index),
      ' ': Math.max(0, index),
      Escape: -1
    } as Record<string, number>)[event.key]
    if (next === undefined) return
    event.preventDefault()
    renderer?.keyboard()
    if (next >= 0) {
      activate(list[Math.min(next, list.length - 1)], true)
    } else activate(null, false)
  }

  // The static table still supports selection if a browser cannot create a Canvas context.
  function handleFallbackPointer(event: PointerEvent) {
    if (renderer) return
    const element = (event.target as Element).closest<HTMLElement>('[data-token]')
    if (element) preview(element)
  }
</script>

<div class="home-bento-visual home-palette-stage" data-active={swatch ? '' : undefined} data-pinned={pinned || undefined}>
  <div aria-hidden="true" class="home-annotation home-palette-annotations">
    <span>Display P3</span>
    <span>{summary}</span>
  </div>
  <div
    bind:this={stage}
    aria-activedescendant={swatch?.id}
    aria-label={label}
    class="home-palette-scene"
    onfocusout={(event) => {
      if (!event.currentTarget.parentElement?.contains(event.relatedTarget as Node | null) && !pinnedNow) activate(null, false)
    }}
    onclick={(event) => {
      if (renderer) return
      const element = (event.target as Element).closest<HTMLElement>('[data-token]')
      if (element) choose(element)
    }}
    onkeydown={handleKeyDown}
    onpointerleave={(event) => {
      if (!renderer && event.pointerType === 'mouse') preview(null)
    }}
    onpointerover={handleFallbackPointer}
    role="listbox"
    tabindex="0">
    {@render children()}
    <canvas bind:this={canvas} aria-hidden="true" class="home-palette-canvas"></canvas>
  </div>
  <div aria-hidden="true" class="home-palette-inspector">
    <span class="home-palette-current-swatch" style:background-color={swatch?.value}></span>
    <code class="home-palette-token">{swatch?.token}</code>
    <code class="home-palette-value">{swatch?.value}</code>
    <span class="home-palette-gamut">{swatch ? swatch.wide ? 'P3' : 'sRGB' : ''}</span>
  </div>
</div>
