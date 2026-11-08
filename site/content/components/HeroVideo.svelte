<script lang="ts">
  import '~/site/styles/promo-video.css'
  import IconPlayerPlayFilled from '@tabler/icons-svelte-runes/icons/player-play-filled'
  import IconX from '@tabler/icons-svelte-runes/icons/x'
  import { getSite } from '@master/internal-site/site'
  import { isPlainClick, isPromoEndedMessage, promoEmbedUrl, promoPlayerOrigin, promoVideo } from '~/site/utils/promo-video'

  /**
   * A clear-glass hero control that opens the film in a dialog. The YouTube player loads only when the dialog opens
   * and is removed when it closes, so nothing plays or downloads in the background. Before hydration it links to YouTube.
   * When the film ends the dialog closes by itself, instead of leaving the reader on YouTube's suggestions.
   */
  const { t } = getSite()
  let dialog: HTMLDialogElement
  let frame: HTMLIFrameElement | undefined = $state()
  let open = $state(false)

  // The player reports state only to a page that announces it is listening and subscribes to state changes.
  function listen() {
    const player = frame?.contentWindow
    if (!player) return
    player.postMessage(JSON.stringify({ event: 'listening', id: 'promo', channel: 'widget' }), promoPlayerOrigin)
    player.postMessage(JSON.stringify({ event: 'command', func: 'addEventListener', args: ['onStateChange'], id: 'promo', channel: 'widget' }), promoPlayerOrigin)
  }

  async function receive(event: MessageEvent) {
    if (!open || event.origin !== promoPlayerOrigin || event.source !== frame?.contentWindow) return
    if (!isPromoEndedMessage(event.data)) return
    // A dialog closed under a fullscreen player would leave the page in fullscreen with nothing to show.
    if (document.fullscreenElement) await document.exitFullscreen().catch(() => {})
    close()
  }

  function show(event: MouseEvent) {
    if (!isPlainClick(event)) return
    event.preventDefault()
    open = true
    dialog.showModal()
  }

  function close() {
    dialog.close()
  }

  // A click on the backdrop lands on the dialog itself; the player and the close button sit inside it.
  function dismiss(event: MouseEvent) {
    if (event.target === dialog) close()
  }
</script>

<svelte:window onmessage={receive} />

<a class="home-hero-video" href={promoVideo.watchUrl} onclick={show}>
  <span aria-hidden="true" class="home-hero-video-disc"><IconPlayerPlayFilled size={14} /></span>
  {t('Watch the film')}
</a>

<dialog aria-label={promoVideo.title} bind:this={dialog} class="promo-dialog" onclick={dismiss} onclose={() => { open = false }}>
  <button aria-label={t('Close video')} class="promo-dialog-close" onclick={close} type="button">
    <IconX aria-hidden="true" size={18} stroke={1.75} />
  </button>
  <div class="promo-video">
    {#if open}
      <iframe
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowfullscreen
        bind:this={frame}
        class="promo-video-frame"
        onload={listen}
        referrerpolicy="strict-origin-when-cross-origin"
        src={promoEmbedUrl({ origin: location.origin })}
        title={promoVideo.title}></iframe>
    {/if}
  </div>
</dialog>
