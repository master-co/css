<script lang="ts">
  import { onMount } from 'svelte'

  /** Hangs the page lamp over every `.home-lit` element below the hero and in the footer; without script, CSS keeps the resting light. */
  onMount(() => {
    const root = document.body
    let cleanup: (() => void) | undefined
    let disposed = false
    // Only a failed download falls back silently to the resting light in CSS; a fault in the lamp surfaces.
    import('./home-lamp').then(({ mountHomeLamp }) => {
      if (!disposed) cleanup = mountHomeLamp(root)
    }, () => undefined)
    return () => {
      disposed = true
      cleanup?.()
    }
  })
</script>
