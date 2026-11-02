<script lang="ts">
  import type { Snippet } from 'svelte'
  import { onMount } from 'svelte'
  import IconPlayerPause from '@tabler/icons-svelte-runes/icons/player-pause'
  import IconPlayerPlay from '@tabler/icons-svelte-runes/icons/player-play'
  import IconRefresh from '@tabler/icons-svelte-runes/icons/refresh'

  /** Play, pause and replay the native animations inside; they start paused and respect reduced motion. */
  let { children }: { children?: Snippet } = $props()
  let element = $state<HTMLDivElement>()
  let playing = $state(false)
  onMount(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => {
      element?.getAnimations({ subtree: true }).forEach(animation => animation.pause())
      playing = false
    }
    sync()
    preference.addEventListener('change', sync)
    return () => preference.removeEventListener('change', sync)
  })
  const control = (action: 'play' | 'pause' | 'restart') => {
    element?.getAnimations({ subtree: true }).forEach(animation => {
      if (action === 'restart') animation.currentTime = 0
      if (action === 'pause') animation.pause()
      else animation.play()
    })
    playing = action !== 'pause'
  }
</script>

<div class="grid gap-md w-full">
  <div bind:this={element} data-playback={playing ? 'playing' : 'paused'}>{@render children?.()}</div>
  <div class="ui-player" role="group" aria-label="Animation controls" data-state={playing ? 'playing' : 'paused'}>
    <button type="button" class="ui-button" data-size="sm" onclick={() => control(playing ? 'pause' : 'play')}>
      {#if playing}<IconPlayerPause aria-hidden="true" />{:else}<IconPlayerPlay aria-hidden="true" />{/if}{playing ? 'Pause' : 'Play'}
    </button>
    <button type="button" class="ui-button" data-size="sm" data-variant="quiet" onclick={() => control('restart')}><IconRefresh aria-hidden="true" />Replay</button>
    <span class="ui-player-time"><output>{playing ? 'Playing' : 'Paused'}</output></span>
  </div>
</div>
