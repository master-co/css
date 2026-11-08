<script lang="ts">
  import '~/site/styles/promo-video.css'
  import IconPlayerPlayFilled from '@tabler/icons-svelte-runes/icons/player-play-filled'
  import IconX from '@tabler/icons-svelte-runes/icons/x'
  import { getSite } from '@master/internal-site/site'
  import { isPlainClick, promoEmbedUrl, promoVideo } from '~/site/utils/promo-video'

  /**
   * A clear-glass hero control that opens the film in a dialog. The YouTube player loads only when the dialog opens
   * and is removed when it closes, so nothing plays or downloads in the background. Before hydration it links to YouTube.
   */
  const { t } = getSite()
  let dialog: HTMLDialogElement
  let open = $state(false)

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
        class="promo-video-frame"
        referrerpolicy="strict-origin-when-cross-origin"
        src={promoEmbedUrl()}
        title={promoVideo.title}></iframe>
    {/if}
  </div>
</dialog>
