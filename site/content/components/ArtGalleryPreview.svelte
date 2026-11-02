<script lang="ts" module>
  import { flushSync } from 'svelte'
  import { galleryPlacements } from './design-system-content'
  import galleryLoungeImage from '~/site/assets/images/home/nordic-gallery-lounge.png'
  import openLivingImage from '~/site/assets/images/home/nordic-open-living.png'
  import readingCornerImage from '~/site/assets/images/home/nordic-reading-corner.png'
  import shelfRoomImage from '~/site/assets/images/home/nordic-shelf-room.png'

  interface Artwork {
    id: string
    title: string
    image: { src: string, width: number, height: number }
    imageAlt: string
  }

  /** The one name the open photo carries, in the grid before it opens and in the dialog while it is open. */
  const viewTransitionName = 'home-gallery-photo'

  const artworks = [
    {
      id: 'reading-corner',
      title: 'Reading corner',
      image: readingCornerImage,
      imageAlt: 'Nordic reading corner with armchair, shelves, and filtered window light'
    },
    {
      id: 'shelf-room',
      title: 'Shelf room',
      image: shelfRoomImage,
      imageAlt: 'Nordic open-plan room with sofa, round table, and built-in wooden shelving'
    },
    {
      id: 'open-living',
      title: 'Open living room',
      image: openLivingImage,
      imageAlt: 'Bright Nordic living room with light wood flooring and white seating'
    },
    {
      id: 'gallery-lounge',
      title: 'Gallery lounge',
      image: galleryLoungeImage,
      imageAlt: 'Nordic living room with framed wall art, lounge chairs, and a cream sofa'
    }
  ] satisfies readonly Artwork[]

  const placements: Record<string, string> = Object.fromEntries(galleryPlacements.map((placement) => [placement.id, placement.className]))
  const gridColumns = 12

  /**
   * Runs a DOM update as a view transition, so the named photo moves between the grid and the dialog.
   * Without the API, or with reduced motion, the update happens at once.
   */
  function transition(update: () => void) {
    if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      update()
      return Promise.resolve()
    }
    // Skipping an interrupted visual transition still leaves the requested DOM update applied.
    const animation = document.startViewTransition(() => flushSync(update))
    void animation.ready.catch(() => undefined)
    return animation.finished.catch(() => undefined)
  }

  /** The dialog lives at the end of the body, as a portal would place it. */
  function toBody(node: HTMLElement) {
    document.body.append(node)
    return () => node.remove()
  }
</script>

<script lang="ts">
  import IconX from '@tabler/icons-svelte-runes/icons/x'
  import Image from '@master/internal-site/components/Image.svelte'
  import { getSite } from '@master/internal-site/site'

  /** A grid of photos placed by span classes; each opens into a dialog with a view transition. */
  let { class: className }: { class?: string } = $props()
  const { t } = getSite()
  const titleId = $props.id()
  let modalArtworkId = $state<string>()
  let modalFrameAspectRatio = $state(1.6)
  const artworkFrames: Record<string, HTMLElement | null> = {}
  let closeButton = $state<HTMLButtonElement>()
  let dialog = $state<HTMLDialogElement>()
  let opening = false
  let closing = false
  let previousFocus: HTMLElement | null = null
  let restoreFocus = false
  let guides = $state<HTMLDivElement>()
  let selected = $state<{ id: string, columns: number[] }>()
  const modalArtwork = $derived(artworks.find((artwork) => artwork.id === modalArtworkId))

  const frameOf = (id: string) => (node: HTMLElement) => {
    artworkFrames[id] = node
    return () => { artworkFrames[id] = null }
  }

  // The photo in hand selects the columns it spans, read from where the guides actually fall.
  function select(id: string, photo: HTMLElement) {
    const { left, right } = photo.getBoundingClientRect()
    const columns = [...guides?.children ?? []].flatMap((guide, index) => {
      const rect = guide.getBoundingClientRect()
      return rect.left >= left - 1 && rect.right <= right + 1 ? [index] : []
    })
    selected = { id, columns }
  }

  function deselect() {
    selected = undefined
  }

  function openArtwork(artworkId: string) {
    const frame = artworkFrames[artworkId]
    if (!frame || opening) return
    opening = true
    const artwork = artworks.find((artwork) => artwork.id === artworkId)!
    previousFocus = frame.closest<HTMLButtonElement>('button')
    // The grid photo carries the name into the old snapshot; the dialog photo takes it over in the new one.
    frame.style.viewTransitionName = viewTransitionName
    void transition(() => {
      frame.style.viewTransitionName = ''
      modalFrameAspectRatio = artwork.image.width / artwork.image.height
      modalArtworkId = artworkId
    }).finally(() => { opening = false })
  }

  function closeArtwork() {
    if (!modalArtworkId || closing) return
    closing = true
    const frame = artworkFrames[modalArtworkId]
    restoreFocus = true
    void transition(() => {
      modalArtworkId = undefined
      if (frame) frame.style.viewTransitionName = viewTransitionName
    }).finally(() => {
      if (frame) frame.style.viewTransitionName = ''
      closing = false
    })
  }

  // A photo still on its way fades in over its placeholder tone when it arrives; one already loaded stays as it is.
  $effect(() => {
    const cleanups = Object.values(artworkFrames).map((frame) => {
      const image = frame?.querySelector('img')
      if (!frame || !image || image.complete) return undefined
      frame.dataset.pending = ''
      const settle = () => delete frame.dataset.pending
      image.addEventListener('load', settle, { once: true })
      image.addEventListener('error', settle, { once: true })
      return () => {
        image.removeEventListener('load', settle)
        image.removeEventListener('error', settle)
      }
    })
    return () => cleanups.forEach((cleanup) => cleanup?.())
  })

  $effect(() => {
    if (modalArtwork || !restoreFocus) return
    restoreFocus = false
    previousFocus?.focus({ preventScroll: true })
  })

  $effect(() => {
    if (!modalArtwork || !dialog) return
    if (!dialog.open) dialog.showModal()
    closeButton?.focus({ preventScroll: true })
  })

  $effect(() => {
    if (!modalArtwork) return
    const previousOverflow = document.body.style.overflow
    const previousPadding = document.body.style.paddingRight
    const scrollbar = window.innerWidth - document.documentElement.clientWidth
    if (scrollbar > 0) document.body.style.paddingRight = `${parseFloat(getComputedStyle(document.body).paddingRight) + scrollbar}px`
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
      document.body.style.paddingRight = previousPadding
    }
  })
</script>

<div class={[className, 'home-hatch']}>
  <!-- The 12-column layout grid behind the photos: columns as quiet bands, gutters left hatched. -->
  <div bind:this={guides} aria-hidden="true" class="home-gallery-grid home-gallery-guides">
    {#each { length: gridColumns }, index (index)}
      <span data-active={selected?.columns.includes(index) || undefined}></span>
    {/each}
  </div>
  <div class="home-gallery-grid">
    {#each artworks as artwork (artwork.id)}
      <button
        aria-label={`${t('Open photo')}: ${t(artwork.title)}`}
        class={['home-gallery-photo', placements[artwork.id]]}
        data-selected={selected?.id === artwork.id || undefined}
        onblur={deselect}
        onclick={() => openArtwork(artwork.id)}
        onfocus={(event) => select(artwork.id, event.currentTarget)}
        onpointerenter={(event) => select(artwork.id, event.currentTarget)}
        onpointerleave={deselect}
        type="button">
        <span class={['home-gallery-frame', modalArtworkId === artwork.id && 'invisible']} {@attach frameOf(artwork.id)}>
          <!-- Four small photos load with the page at low priority, so a cell is rarely empty when the card scrolls in. -->
          <Image alt={t(artwork.imageAlt)} class="object-cover object-center" fetchpriority="low" fill loading="eager" sizes="(min-width: 64rem) 34vw, 50vw" src={artwork.image} />
        </span>
        <span aria-hidden="true" class="home-gallery-classes">
          {#each placements[artwork.id].split(' ') as name (name)}<code>{name}</code>{/each}
        </span>
      </button>
    {/each}
  </div>

  {#if modalArtwork}<dialog
      bind:this={dialog}
      {@attach toBody}
      aria-labelledby={titleId}
      class="home-gallery-dialog"
      oncancel={(event) => {
        event.preventDefault()
        closeArtwork()
      }}
      onpointerdown={(event) => {
        if (event.target instanceof Element && !event.target.closest('[data-home-art-modal-content]')) closeArtwork()
      }}>
      <button
        bind:this={closeButton}
        aria-label={t('Close photo')}
        class="home-gallery-close"
        data-home-art-modal-content=""
        onclick={closeArtwork}
        type="button">
        <IconX aria-hidden="true" size={16} stroke={1.75} />
      </button>
      <figure
        class="home-gallery-view"
        data-home-art-modal-content=""
        style:aspect-ratio={modalFrameAspectRatio}
        style:width={`min(${modalFrameAspectRatio >= 1 ? '92vw' : '78vw'},calc(var(--home-gallery-height)*${modalFrameAspectRatio}))`}
        style:view-transition-name={viewTransitionName}>
        <Image alt={t(modalArtwork.imageAlt)} class="object-cover object-center" fill sizes="92vw" src={modalArtwork.image} />
      </figure>
      <p class="home-gallery-caption" data-home-art-modal-content="" id={titleId}><span>{t(modalArtwork.title)}</span><code>{placements[modalArtwork.id]}</code></p>
    </dialog>{/if}
</div>
