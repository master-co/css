'use client'

import { type CSSProperties, useCallback, useEffect, useRef, useState } from 'react'
import { createPortal, flushSync } from 'react-dom'
import { IconX } from '@tabler/icons-react'
import clsx from 'clsx'
import Image, { type StaticImageData } from 'next/image'
import { useTranslation } from '~/internal/contexts/i18n'
import galleryLoungeImage from '~/site/assets/images/home/nordic-gallery-lounge.png'
import loftLivingImage from '~/site/assets/images/home/nordic-loft-living.png'
import openLivingImage from '~/site/assets/images/home/nordic-open-living.png'
import readingCornerImage from '~/site/assets/images/home/nordic-reading-corner.png'
import shelfRoomImage from '~/site/assets/images/home/nordic-shelf-room.png'

type ViewTransitionDocument = Document & {
    startViewTransition?: (update: () => void) => { finished?: Promise<void> }
}

interface Artwork {
    id: string
    title: string
    description: string
    image: StaticImageData
    imageAlt: string
    imageTransitionName: string
    layoutClassName: string
    placementStyle: CSSProperties
    objectPositionClassName?: string
}

const rootTransitionClassName = [
    'animation-duration:.56s::vt-group(.home-art)',
    'animation-timing-function:smooth::vt-group(.home-art)',
    'object-center::vt-old(.home-art)',
    'object-center::vt-new(.home-art)',
    'object-cover::vt-old(.home-art)',
    'object-cover::vt-new(.home-art)',
    'overflow:hidden::vt-group(.home-art)',
    'z:2147483647::vt-group(.home-art)'
].join(' ')

const sharedTransitionClassName = 'view-transition-class:home-art'

const artworks = [
    {
        id: 'reading-corner',
        title: 'Container Queries',
        description: 'Bind responsive component changes to container breakpoints, so cards, panels, and tool surfaces adapt where they are placed.',
        image: readingCornerImage,
        imageAlt: 'Nordic reading corner with armchair, shelves, and filtered window light',
        imageTransitionName: 'view-transition-name:home-art-reading-corner-image',
        layoutClassName: 'grid-col-span:4 grid-row-span:2',
        placementStyle: { gridColumnStart: 1, gridRowStart: 1 }
    },
    {
        id: 'shelf-room',
        title: 'CSS Variables',
        description: 'Theme tokens compile to custom properties, letting color, spacing, radius, and motion values stay shared across modes.',
        image: shelfRoomImage,
        imageAlt: 'Nordic open-plan room with sofa, round table, and built-in wooden shelving',
        imageTransitionName: 'view-transition-name:home-art-shelf-room-image',
        layoutClassName: 'grid-col-span:8',
        placementStyle: { gridColumnStart: 5, gridRowStart: 1 },
        objectPositionClassName: 'object-position:center'
    },
    {
        id: 'loft-living',
        title: 'Selector Variants',
        description: 'Attach hover, focus, media, motion, and custom selector conditions to the declaration they affect.',
        image: loftLivingImage,
        imageAlt: 'Tall Nordic loft living room with black-framed windows and a mezzanine',
        imageTransitionName: 'view-transition-name:home-art-loft-living-image',
        layoutClassName: 'grid-col-span:4 grid-row-span:2',
        placementStyle: { gridColumnStart: 13, gridRowStart: 1 },
        objectPositionClassName: 'object-position:center'
    },
    {
        id: 'open-living',
        title: 'Cascade Layers',
        description: 'Generated rules land in predictable layers, so base styles, components, and utilities keep an intentional override order.',
        image: openLivingImage,
        imageAlt: 'Bright Nordic living room with light wood flooring and white seating',
        imageTransitionName: 'view-transition-name:home-art-open-living-image',
        layoutClassName: 'grid-col-span:4',
        placementStyle: { gridColumnStart: 5, gridRowStart: 2 }
    },
    {
        id: 'gallery-lounge',
        title: 'Motion Tokens',
        description: 'Transitions and animations share duration and easing tokens, so interactive states keep a consistent product rhythm.',
        image: galleryLoungeImage,
        imageAlt: 'Nordic living room with framed wall art, lounge chairs, and a cream sofa',
        imageTransitionName: 'view-transition-name:home-art-gallery-lounge-image',
        layoutClassName: 'grid-col-span:4',
        placementStyle: { gridColumnStart: 9, gridRowStart: 2 }
    }
] satisfies readonly Artwork[]

function getModalImageFrameStyle(artwork: Artwork): CSSProperties {
    const aspectRatio = artwork.image.width > artwork.image.height ? 1.6 : 0.72
    const viewportWidth = artwork.image.width > artwork.image.height ? '92vw' : '78vw'

    return {
        aspectRatio,
        width: `min(${viewportWidth},calc(82dvh*${aspectRatio}))`
    }
}

export default function ArtGalleryPreview({ className }: { className?: string }) {
    const $ = useTranslation()
    const [selectedId, setSelectedId] = useState<string>()
    const [transitionArtworkId, setTransitionArtworkId] = useState<string>()
    const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null)
    const closeButtonRef = useRef<HTMLButtonElement>(null)
    const previousFocusRef = useRef<HTMLElement | null>(null)
    const restoreFocusRef = useRef(false)
    const selectedArtwork = artworks.find((artwork) => artwork.id === selectedId)

    const transition = useCallback((artworkId: string, update: () => void) => {
        const transitionDocument = document as ViewTransitionDocument
        flushSync(() => setTransitionArtworkId(artworkId))

        if (!transitionDocument.startViewTransition) {
            update()
            setTransitionArtworkId(undefined)
            return
        }

        const viewTransition = transitionDocument.startViewTransition(() => {
            flushSync(update)
        })

        viewTransition.finished?.finally(() => {
            setTransitionArtworkId(undefined)
        })
    }, [])

    const openArtwork = useCallback((artworkId: string) => {
        previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
        transition(artworkId, () => setSelectedId(artworkId))
    }, [transition])

    const closeArtwork = useCallback(() => {
        if (!selectedId) return
        restoreFocusRef.current = true
        transition(selectedId, () => setSelectedId(undefined))
    }, [selectedId, transition])

    useEffect(() => {
        setPortalTarget(document.body)

        const rootClasses = rootTransitionClassName.split(' ')
        document.documentElement.classList.add(...rootClasses)
        return () => document.documentElement.classList.remove(...rootClasses)
    }, [])

    useEffect(() => {
        if (!selectedArtwork) {
            if (restoreFocusRef.current) {
                restoreFocusRef.current = false
                previousFocusRef.current?.focus()
            }
            return
        }

        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        closeButtonRef.current?.focus()

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                closeArtwork()
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => {
            document.body.style.overflow = previousOverflow
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [closeArtwork, selectedArtwork])

    return (
        <div className={clsx(className, 'h:md h:lg@md')}>
            <span aria-hidden className={clsx(rootTransitionClassName, 'hidden')} />

            <div
                className="grid grid-cols:16 items-stretch gap:sm h:full p:md"
                style={{ gridTemplateRows: 'repeat(2, minmax(0, 1fr))' }}>
                {artworks.map((artwork) => {
                    const isTransitionArtwork = transitionArtworkId === artwork.id
                    const imageTransitionClassName = isTransitionArtwork && selectedId !== artwork.id
                        ? clsx(sharedTransitionClassName, artwork.imageTransitionName)
                        : 'view-transition-name:none'

                    return (
                        <button
                            aria-label={`${$('Open artwork')}: ${$(artwork.title)}`}
                            className={clsx('rel overflow:hidden min-w:0 outline:1px|solid|subtle bg:surface-base transition:background-color|normal|standard cursor:pointer surface:raised:hover group text:left', artwork.layoutClassName)}
                            key={artwork.id}
                            onClick={() => openArtwork(artwork.id)}
                            style={artwork.placementStyle}
                            type="button">
                            <span className="rel block overflow:hidden size:full">
                                <Image
                                    alt={artwork.imageAlt}
                                    className={clsx('object-center object-cover', imageTransitionClassName, artwork.objectPositionClassName)}
                                    fill
                                    placeholder="blur"
                                    sizes="(min-width: 768px) 34vw, 50vw"
                                    src={artwork.image}
                                />
                            </span>
                        </button>
                    )
                })}
            </div>

            {selectedArtwork && portalTarget && createPortal(
                <div
                    aria-label={$(selectedArtwork.imageAlt)}
                    aria-modal="true"
                    className="fixed inset:0 z:2147483647 grid overflow:auto place-items:center p:md bg:black/.56 backdrop-filter:blur(16px)"
                    onPointerDown={(event) => {
                        if (event.target === event.currentTarget) closeArtwork()
                    }}
                    role="dialog">
                    <button
                        aria-label={$('Close artwork')}
                        className="abs right:md top:md z:2 grid place-content:center size:9x r:xl outline:1px|solid|subtle surface:overlay transition:background-color|normal|standard surface:raised:hover"
                        onClick={closeArtwork}
                        ref={closeButtonRef}
                        type="button">
                        <IconX aria-hidden="true" className="size:4x stroke:1.75" />
                    </button>

                    <div
                        className="rel overflow:hidden bg:black shadow:2xl"
                        style={getModalImageFrameStyle(selectedArtwork)}>
                        <Image
                            alt={selectedArtwork.imageAlt}
                            className={clsx('object-center object-cover', transitionArtworkId === selectedArtwork.id ? clsx(sharedTransitionClassName, selectedArtwork.imageTransitionName) : 'view-transition-name:none', selectedArtwork.objectPositionClassName)}
                            fill
                            placeholder="blur"
                            sizes="92vw"
                            src={selectedArtwork.image}
                        />
                    </div>
                </div>,
                portalTarget
            )}
        </div>
    )
}
