'use client'

import { type CSSProperties, useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { IconX } from '@tabler/icons-react'
import clsx from 'clsx'
import Image, { type StaticImage } from '~/site/docs-shell/components/Image'
import { useTranslation } from '~/site/docs-shell/contexts/i18n'
import galleryLoungeImage from '~/site/assets/images/home/nordic-gallery-lounge.png'
import openLivingImage from '~/site/assets/images/home/nordic-open-living.png'
import readingCornerImage from '~/site/assets/images/home/nordic-reading-corner.png'
import shelfRoomImage from '~/site/assets/images/home/nordic-shelf-room.png'

interface Artwork {
  id: string
  title: string
  image: StaticImage
  imageAlt: string
  placement: CSSProperties
}

interface FrameRect {
  height: number
  left: number
  top: number
  width: number
}

interface ImageAnimation {
  active: boolean
  artworkId: string
  from: FrameRect
  phase: 'opening' | 'closing'
  to: FrameRect
}

const imageTransitionDuration = 480
const imageTransitionEasing = 'cubic-bezier(.2,0,0,1)'
const imageFrameTransition = ['height', 'left', 'top', 'width']
  .map((property) => `${property} ${imageTransitionDuration}ms ${imageTransitionEasing}`)
  .join(',')

const artworks = [
  {
    id: 'reading-corner',
    title: 'Container Queries',
    image: readingCornerImage,
    imageAlt: 'Nordic reading corner with armchair, shelves, and filtered window light',
    placement: { gridColumn: '1 / 5', gridRow: '1 / 3' }
  },
  {
    id: 'shelf-room',
    title: 'CSS Variables',
    image: shelfRoomImage,
    imageAlt: 'Nordic open-plan room with sofa, round table, and built-in wooden shelving',
    placement: { gridColumn: '5 / 13', gridRow: '1' }
  },
  {
    id: 'open-living',
    title: 'Cascade Layers',
    image: openLivingImage,
    imageAlt: 'Bright Nordic living room with light wood flooring and white seating',
    placement: { gridColumn: '5 / 9', gridRow: '2' }
  },
  {
    id: 'gallery-lounge',
    title: 'Motion Tokens',
    image: galleryLoungeImage,
    imageAlt: 'Nordic living room with framed wall art, lounge chairs, and a cream sofa',
    placement: { gridColumn: '9 / 13', gridRow: '2' }
  }
] satisfies readonly Artwork[]

function getFrameRect(element: Element): FrameRect {
  const { height, left, top, width } = element.getBoundingClientRect()
  return { height, left, top, width }
}

function getModalImageFrameRect(aspectRatio: number): FrameRect {
  const width = Math.min(window.innerWidth * (aspectRatio >= 1 ? 0.92 : 0.78), window.innerHeight * 0.82 * aspectRatio)
  const height = width / aspectRatio
  return { height, left: (window.innerWidth - width) / 2, top: (window.innerHeight - height) / 2, width }
}

function getModalImageFrameStyle(aspectRatio: number): CSSProperties {
  return {
    aspectRatio,
    width: `min(${aspectRatio >= 1 ? '92vw' : '78vw'},calc(82dvh*${aspectRatio}))`
  }
}

/** A grid of artworks whose images expand into a modal from their grid position. */
export default function ArtGalleryPreview({ className }: { className?: string }) {
  const $ = useTranslation()
  const [modalArtworkId, setModalArtworkId] = useState<string>()
  const [modalFrameAspectRatio, setModalFrameAspectRatio] = useState(1.6)
  const [modalVisible, setModalVisible] = useState(false)
  const [imageAnimation, setImageAnimation] = useState<ImageAnimation>()
  const [hiddenGridArtworkId, setHiddenGridArtworkId] = useState<string>()
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null)
  const animationFrameRef = useRef<number | undefined>(undefined)
  const animationTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const artworkFrameRefs = useRef<Record<string, HTMLElement | null>>({})
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const restoreFocusRef = useRef(false)
  const modalArtwork = artworks.find((artwork) => artwork.id === modalArtworkId)
  const animatedArtwork = imageAnimation ? artworks.find((artwork) => artwork.id === imageAnimation.artworkId) : undefined
  const modalActive = Boolean(modalArtwork || hiddenGridArtworkId || imageAnimation)

  const clearAnimationTimers = useCallback(() => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
    if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current)
  }, [])

  const animateImage = useCallback((animation: Omit<ImageAnimation, 'active'>, onFinish?: () => void) => {
    clearAnimationTimers()
    setImageAnimation({ ...animation, active: false })
    const isCurrent = (current?: ImageAnimation) => current?.artworkId === animation.artworkId && current.phase === animation.phase
    animationFrameRef.current = requestAnimationFrame(() => {
      setImageAnimation((current) => isCurrent(current) ? { ...current!, active: true } : current)
    })
    animationTimeoutRef.current = setTimeout(() => {
      setImageAnimation((current) => isCurrent(current) ? undefined : current)
      onFinish?.()
    }, imageTransitionDuration + 80)
  }, [clearAnimationTimers])

  const openArtwork = useCallback((artworkId: string) => {
    const sourceFrame = artworkFrameRefs.current[artworkId]
    if (!sourceFrame) return
    const from = getFrameRect(sourceFrame)
    const aspectRatio = from.width / from.height
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setModalFrameAspectRatio(aspectRatio)
    setHiddenGridArtworkId(artworkId)
    setModalArtworkId(artworkId)
    setModalVisible(true)
    animateImage({ artworkId, from, phase: 'opening', to: getModalImageFrameRect(aspectRatio) })
  }, [animateImage])

  const closeArtwork = useCallback(() => {
    if (!modalArtworkId) return
    const artworkId = modalArtworkId
    const sourceFrame = artworkFrameRefs.current[artworkId]
    if (!sourceFrame) return
    restoreFocusRef.current = true
    setModalVisible(false)
    setModalArtworkId(undefined)
    animateImage(
      { artworkId, from: getModalImageFrameRect(modalFrameAspectRatio), phase: 'closing', to: getFrameRect(sourceFrame) },
      () => setHiddenGridArtworkId(undefined)
    )
  }, [animateImage, modalArtworkId, modalFrameAspectRatio])

  useEffect(() => {
    setPortalTarget(document.body)
    return clearAnimationTimers
  }, [clearAnimationTimers])

  useEffect(() => {
    if (modalArtwork || hiddenGridArtworkId || !restoreFocusRef.current) return
    restoreFocusRef.current = false
    previousFocusRef.current?.focus()
  }, [hiddenGridArtworkId, modalArtwork])

  useEffect(() => {
    if (!modalActive) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [modalActive])

  useEffect(() => {
    if (!modalArtwork) return
    closeButtonRef.current?.focus()
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') closeArtwork()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [closeArtwork, modalArtwork])

  return (
    <div className={className}>
      <p aria-hidden="true" className="home-annotation home-gallery-hint">{$('Open a photo')}</p>
      <div className="grid-cols(12) grid-template-rows:repeat(2,minmax(0,1fr)) gap-xs height:100% p-lg p-xl@md home-dot-grid">
        {artworks.map((artwork) => (
          <button
            aria-label={`${$('Open artwork')}: ${$(artwork.title)}`}
            className="position:relative overflow:hidden min-width:0 outline-line-subtle outline-style:solid outline-width:1px bg-surface-base transition-normal transition-smooth transition-property:background-color cursor:pointer bg-surface-raised:hover outline-color:var(--home-ink):focus-visible outline-offset:2px:focus-visible outline-width:2px:focus-visible"
            key={artwork.id}
            onClick={() => openArtwork(artwork.id)}
            style={artwork.placement}
            type="button">
            <span
              className={clsx('position:relative display:block overflow:hidden height:100% width:100%', hiddenGridArtworkId === artwork.id && 'visibility:hidden')}
              ref={(node) => {
                artworkFrameRefs.current[artwork.id] = node
              }}>
              <Image alt={$(artwork.imageAlt)} className="object-fit:cover object-position:center" fill sizes="(min-width: 64rem) 34vw, 50vw" src={artwork.image} />
            </span>
          </button>
        ))}
      </div>

      {portalTarget && createPortal(
        <div
          aria-hidden={modalArtwork ? undefined : 'true'}
          aria-label={modalArtwork ? $(modalArtwork.imageAlt) : undefined}
          aria-modal={modalArtwork ? 'true' : undefined}
          className={clsx('position:fixed inset:0 z-index:2147483647', modalVisible ? 'pointer-events:auto' : 'pointer-events:none')}
          onPointerDown={(event) => {
            if (modalArtwork && event.target instanceof Element && !event.target.closest('[data-home-art-modal-content]')) closeArtwork()
          }}
          role={modalArtwork ? 'dialog' : undefined}>
          <div
            aria-hidden="true"
            className={clsx(
              'position:absolute inset:0 bg-black/0.56 transition-crisp transition-duration:480ms transition-property:opacity,backdrop-filter',
              modalVisible ? 'opacity:1 backdrop-filter:blur(16px)' : 'opacity:0 backdrop-filter:blur(0px)'
            )} />
          {modalArtwork && <>
            <button
              aria-label={$('Close artwork')}
              className="position:absolute right-md top-md z-index:2 display:grid place-content:center height:2.25rem width:2.25rem r-xl outline-line-subtle outline-style:solid outline-width:1px bg-surface-floating transition-normal transition-smooth transition-property:background-color bg-surface-raised:hover"
              data-home-art-modal-content=""
              onClick={closeArtwork}
              ref={closeButtonRef}
              type="button">
              <IconX aria-hidden="true" size={16} stroke={1.75} />
            </button>
            <div
              className={clsx('position:fixed left:50% top:50% overflow:hidden bg-black shadow-2xl translate:-50%|-50%', imageAnimation?.artworkId === modalArtwork.id && imageAnimation.phase === 'opening' && 'opacity:0')}
              data-home-art-modal-content=""
              style={getModalImageFrameStyle(modalFrameAspectRatio)}>
              <Image alt={$(modalArtwork.imageAlt)} className="object-fit:cover object-position:center" fill sizes="92vw" src={modalArtwork.image} />
            </div>
          </>}
          {animatedArtwork && imageAnimation && (
            <div
              aria-hidden="true"
              className="position:fixed z-index:3 overflow:hidden bg-black shadow-2xl pointer-events:none"
              style={{
                ...(imageAnimation.active ? imageAnimation.to : imageAnimation.from),
                transition: imageAnimation.active ? imageFrameTransition : 'none'
              }}>
              <Image alt="" className="object-fit:cover object-position:center" fill sizes="92vw" src={animatedArtwork.image} />
            </div>
          )}
        </div>,
        portalTarget
      )}
    </div>
  )
}
