<script lang="ts">
  import { onMount } from 'svelte'

  /** The words and actions render without JavaScript; only the field and its lamp hydrate. */
  let ref = $state<HTMLCanvasElement>()

  onMount(() => {
    const canvas = ref
    const host = canvas?.closest<HTMLElement>('.home-cta')
    if (!canvas || !host) return
    let disposed = false
    let cleanup: (() => void) | undefined
    // Notifications batch while layout settles; the last entry is the current state.
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[entries.length - 1]
      if (!entry.isIntersecting) return
      observer.disconnect()
      import('./cta-canvas').then(({ mountCTAField }) => {
        if (!disposed) cleanup = mountCTAField(host, canvas)
      }).catch(() => { /* The invitation and its single point remain complete without Canvas. */ })
    }, { rootMargin: '240px' })
    observer.observe(canvas)
    return () => {
      disposed = true
      observer.disconnect()
      cleanup?.()
    }
  })
</script>

<canvas class="home-cta-canvas" bind:this={ref} aria-hidden="true"></canvas>
