'use client'

import { type CSSProperties, useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal, flushSync } from 'react-dom'
import { IconX } from '@tabler/icons-react'
import clsx from 'clsx'
import Image, { type StaticImage } from '~/site/docs-shell/components/Image'
import { useTranslation } from '~/site/docs-shell/contexts/i18n'
import { galleryPlacements } from './design-system-content'
import galleryLoungeImage from '~/site/assets/images/home/nordic-gallery-lounge.png'
import openLivingImage from '~/site/assets/images/home/nordic-open-living.png'
import readingCornerImage from '~/site/assets/images/home/nordic-reading-corner.png'
import shelfRoomImage from '~/site/assets/images/home/nordic-shelf-room.png'

interface Artwork {
  id: string
  title: string
  image: StaticImage
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

function getModalImageFrameStyle(aspectRatio: number): CSSProperties {
  return {
    aspectRatio,
    width: `min(${aspectRatio >= 1 ? '92vw' : '78vw'},calc(var(--home-gallery-height)*${aspectRatio}))`,
    viewTransitionName
  }
}

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

/** A grid of photos placed by span classes; each opens into a dialog with a view transition. */
export default function ArtGalleryPreview({ className }: { className?: string }) {
  const $ = useTranslation()
  const titleId = useId()
  const [modalArtworkId, setModalArtworkId] = useState<string>()
  const [modalFrameAspectRatio, setModalFrameAspectRatio] = useState(1.6)
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null)
  const artworkFrameRefs = useRef<Record<string, HTMLElement | null>>({})
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const openingRef = useRef(false)
  const closingRef = useRef(false)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const restoreFocusRef = useRef(false)
  const guidesRef = useRef<HTMLDivElement>(null)
  const [selected, setSelected] = useState<{ id: string, columns: number[] }>()
  const modalArtwork = artworks.find((artwork) => artwork.id === modalArtworkId)

  // The photo in hand selects the columns it spans, read from where the guides actually fall.
  const select = useCallback((id: string, photo: HTMLElement) => {
    const { left, right } = photo.getBoundingClientRect()
    const columns = [...guidesRef.current?.children ?? []].flatMap((guide, index) => {
      const rect = guide.getBoundingClientRect()
      return rect.left >= left - 1 && rect.right <= right + 1 ? [index] : []
    })
    setSelected({ id, columns })
  }, [])

  const deselect = useCallback(() => setSelected(undefined), [])

  const openArtwork = useCallback((artworkId: string) => {
    const frame = artworkFrameRefs.current[artworkId]
    if (!frame || openingRef.current) return
    openingRef.current = true
    const artwork = artworks.find((artwork) => artwork.id === artworkId)!
    previousFocusRef.current = frame.closest<HTMLButtonElement>('button')
    // The grid photo carries the name into the old snapshot; the dialog photo takes it over in the new one.
    frame.style.viewTransitionName = viewTransitionName
    void transition(() => {
      frame.style.viewTransitionName = ''
      setModalFrameAspectRatio(artwork.image.width / artwork.image.height)
      setModalArtworkId(artworkId)
    }).finally(() => { openingRef.current = false })
  }, [])

  const closeArtwork = useCallback(() => {
    if (!modalArtworkId || closingRef.current) return
    closingRef.current = true
    const frame = artworkFrameRefs.current[modalArtworkId]
    restoreFocusRef.current = true
    void transition(() => {
      setModalArtworkId(undefined)
      if (frame) frame.style.viewTransitionName = viewTransitionName
    }).finally(() => {
      if (frame) frame.style.viewTransitionName = ''
      closingRef.current = false
    })
  }, [modalArtworkId])

  useEffect(() => {
    setPortalTarget(document.body)
  }, [])

  // A photo still on its way fades in over its placeholder tone when it arrives; one already loaded stays as it is.
  useEffect(() => {
    const cleanups = Object.values(artworkFrameRefs.current).map((frame) => {
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
  }, [])

  useEffect(() => {
    if (modalArtwork || !restoreFocusRef.current) return
    restoreFocusRef.current = false
    previousFocusRef.current?.focus({ preventScroll: true })
  }, [modalArtwork])

  useLayoutEffect(() => {
    if (!modalArtwork) return
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
    closeButtonRef.current?.focus({ preventScroll: true })
  }, [modalArtwork])

  useEffect(() => {
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
  }, [modalArtwork])

  return (
    <div className={clsx(className, 'home-hatch')}>
      {/* The 12-column layout grid behind the photos: columns as quiet bands, gutters left hatched. */}
      <div aria-hidden="true" className="home-gallery-grid home-gallery-guides" ref={guidesRef}>
        {Array.from({ length: gridColumns }, (_, index) => <span data-active={selected?.columns.includes(index) || undefined} key={index} />)}
      </div>
      <div className="home-gallery-grid">
        {artworks.map((artwork) => (
          <button
            aria-label={`${$('Open photo')}: ${$(artwork.title)}`}
            className={clsx('home-gallery-photo', placements[artwork.id])}
            data-selected={selected?.id === artwork.id || undefined}
            key={artwork.id}
            onBlur={deselect}
            onClick={() => openArtwork(artwork.id)}
            onFocus={(event) => select(artwork.id, event.currentTarget)}
            onPointerEnter={(event) => select(artwork.id, event.currentTarget)}
            onPointerLeave={deselect}
            type="button">
            <span
              className={clsx('home-gallery-frame', modalArtworkId === artwork.id && 'visibility:hidden')}
              ref={(node) => {
                artworkFrameRefs.current[artwork.id] = node
              }}>
              {/* Four small photos load with the page at low priority, so a cell is rarely empty when the card scrolls in. */}
              <Image alt={$(artwork.imageAlt)} className="object-fit:cover object-position:center" fetchPriority="low" fill loading="eager" sizes="(min-width: 64rem) 34vw, 50vw" src={artwork.image} />
            </span>
            <span aria-hidden="true" className="home-gallery-classes">
              {placements[artwork.id].split(' ').map((name) => <code key={name}>{name}</code>)}
            </span>
          </button>
        ))}
      </div>

      {portalTarget && modalArtwork && createPortal(
        <dialog
          aria-labelledby={titleId}
          className="home-gallery-dialog"
          onCancel={(event) => {
            event.preventDefault()
            closeArtwork()
          }}
          onPointerDown={(event) => {
            if (event.target instanceof Element && !event.target.closest('[data-home-art-modal-content]')) closeArtwork()
          }}
          ref={dialogRef}>
          <button
            aria-label={$('Close photo')}
            className="home-gallery-close"
            data-home-art-modal-content=""
            onClick={closeArtwork}
            ref={closeButtonRef}
            type="button">
            <IconX aria-hidden="true" size={16} stroke={1.75} />
          </button>
          <figure className="home-gallery-view" data-home-art-modal-content="" style={getModalImageFrameStyle(modalFrameAspectRatio)}>
            <Image alt={$(modalArtwork.imageAlt)} className="object-fit:cover object-position:center" fill sizes="92vw" src={modalArtwork.image} />
          </figure>
          <p className="home-gallery-caption" data-home-art-modal-content="" id={titleId}>
            <span>{$(modalArtwork.title)}</span>
            <code>{placements[modalArtwork.id]}</code>
          </p>
        </dialog>,
        portalTarget
      )}
    </div>
  )
}
