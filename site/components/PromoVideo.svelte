<script lang="ts">
  import '~/site/styles/promo-video.css'
  import Image from '@master/internal-site/components/Image.svelte'
  import IconPlayerPlayFilled from '@tabler/icons-svelte-runes/icons/player-play-filled'
  import { getSite } from '@master/internal-site/site'
  import poster from '~/site/assets/images/promo/master-css-2-0.jpg'
  import { isPlainClick, promoEmbedUrl, promoVideo } from '~/site/utils/promo-video'

  /**
   * The film as a poster that loads the YouTube player only when a reader plays it.
   * Before hydration, or with a modified click, the poster is a link to the video on YouTube.
   */
  let { class: className }: { class?: string } = $props()
  const { t } = getSite()
  let playing = $state(false)

  function play(event: MouseEvent) {
    if (!isPlainClick(event)) return
    event.preventDefault()
    playing = true
  }
</script>

<figure class={['promo-video', className]}>
  {#if playing}
    <iframe
      allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
      allowfullscreen
      class="promo-video-frame"
      referrerpolicy="strict-origin-when-cross-origin"
      src={promoEmbedUrl()}
      title={promoVideo.title}></iframe>
  {:else}
    <a class="promo-video-poster" href={promoVideo.watchUrl} onclick={play}>
      <Image alt="" fill sizes="(min-width: 52rem) 45rem, 100vw" src={poster} />
      <span class="promo-video-play" aria-hidden="true"><IconPlayerPlayFilled size={22} /></span>
      <span class="sr-only">{t('Watch the film')}: {promoVideo.title}</span>
    </a>
  {/if}
</figure>
