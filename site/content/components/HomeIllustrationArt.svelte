<script lang="ts">
  import { homeIconArtwork } from '~/site/assets/images/home/icons/artwork'
  import '~/site/assets/images/home/icons/artwork.css'
  import Image from '~/site/docs-shell/components/Image.svelte'
  import type { HomeIllustrationId } from './home-illustration'

  /** Decorative, theme-specific artwork. CSS reserves its square before the image loads. Islands render it directly; pages use `HomeIllustration.astro`. */
  let { class: className, icon, size = 80 }: { class?: string, icon: HomeIllustrationId, size?: number } = $props()
  const artwork = $derived(homeIconArtwork[icon])
</script>

<span aria-hidden="true" class={['home-illustration', className]} data-home-icon={icon}>
  <Image alt="" class="home-icon-artwork home-illustration-light" height={size} src={artwork.light} width={size} />
  <Image alt="" class="home-icon-artwork home-illustration-dark" height={size} src={artwork.dark} width={size} />
</span>
