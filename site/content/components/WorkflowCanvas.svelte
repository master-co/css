<script lang="ts">
  import IconPlayerPauseFilled from '@tabler/icons-svelte-runes/icons/player-pause-filled'
  import IconPlayerPlayFilled from '@tabler/icons-svelte-runes/icons/player-play-filled'
  import { getSite } from '~/site/docs-shell/site'
  import type { WorkflowFigure } from './workflow-canvas'

  /** Only the drawing hydrates. Links, code and native controls stay server rendered. */
  let { figure }: { figure: WorkflowFigure } = $props()
  const { t } = getSite()
  let canvas = $state<HTMLCanvasElement>()

  $effect(() => {
    const scene = canvas?.closest<HTMLElement>('.home-wf-scene')
    if (!canvas || !scene) return
    const element = canvas
    const current = figure
    let disposed = false
    let cleanup: (() => void) | undefined
    // The lower-page illustrations do not load their painter until they approach the viewport.
    // Notifications batch while layout settles; the last entry is the current state.
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[entries.length - 1]
      if (!entry.isIntersecting) return
      observer.disconnect()
      import('./workflow-canvas').then(({ mountWorkflowCanvas }) => {
        if (!disposed) cleanup = mountWorkflowCanvas(scene, element, current)
      }).catch(() => { /* Native content remains usable if the drawing cannot load. */ })
    }, { rootMargin: '600px 0px' })
    observer.observe(scene)
    return () => {
      disposed = true
      observer.disconnect()
      cleanup?.()
    }
  })
</script>

<canvas bind:this={canvas} aria-hidden="true" class="home-wf-canvas"></canvas>
<!-- The page lamp and the painter write onto this button after hydration. -->
<button aria-label={t('Pause illustration')} class="home-lit home-wf-play" data-wf-play="" data-pause-label={t('Pause illustration')} data-play-label={t('Play illustration')} type="button">
  <IconPlayerPauseFilled aria-hidden="true" class="home-wf-pause-icon" size={12} />
  <IconPlayerPlayFilled aria-hidden="true" class="home-wf-play-icon" size={12} />
</button>
