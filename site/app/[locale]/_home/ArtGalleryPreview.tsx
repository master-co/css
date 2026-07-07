'use client'

import { type CSSProperties, useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { IconX } from '@tabler/icons-react'
import clsx from 'clsx'
import Image, { type StaticImageData } from 'next/image'
import { useTranslation } from '~/internal/contexts/i18n'
import galleryLoungeImage from '~/site/assets/images/home/nordic-gallery-lounge.png'
import openLivingImage from '~/site/assets/images/home/nordic-open-living.png'
import readingCornerImage from '~/site/assets/images/home/nordic-reading-corner.png'
import shelfRoomImage from '~/site/assets/images/home/nordic-shelf-room.png'

interface Artwork {
    id: string
    title: string
    description: string
    image: StaticImageData
    imageAlt: string
    layoutClassName: string
    placementStyle: CSSProperties
    objectPositionClassName?: string
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
const backdropTransitionEasing = 'cubic-bezier(.16,1,.3,1)'
const backdropTransition = `backdrop-filter ${imageTransitionDuration}ms ${backdropTransitionEasing}, opacity ${imageTransitionDuration}ms ${backdropTransitionEasing}`
const imageFrameTransition = [
    `height ${imageTransitionDuration}ms ${imageTransitionEasing}`,
    `left ${imageTransitionDuration}ms ${imageTransitionEasing}`,
    `top ${imageTransitionDuration}ms ${imageTransitionEasing}`,
    `width ${imageTransitionDuration}ms ${imageTransitionEasing}`
].join(',')

const artworks = [
    {
        id: 'reading-corner',
        title: 'Container Queries',
        description: 'Bind responsive component changes to container breakpoints, so cards, panels, and tool surfaces adapt where they are placed.',
        image: readingCornerImage,
        imageAlt: 'Nordic reading corner with armchair, shelves, and filtered window light',
        layoutClassName: 'grid-col-span:4 grid-row-span:2',
        placementStyle: { gridColumnStart: 1, gridRowStart: 1 }
    },
    {
        id: 'shelf-room',
        title: 'CSS Variables',
        description: 'Theme tokens compile to custom properties, letting color, spacing, radius, and motion values stay shared across modes.',
        image: shelfRoomImage,
        imageAlt: 'Nordic open-plan room with sofa, round table, and built-in wooden shelving',
        layoutClassName: 'grid-col-span:8',
        placementStyle: { gridColumnStart: 5, gridRowStart: 1 },
        objectPositionClassName: 'object-position:center'
    },
    {
        id: 'open-living',
        title: 'Cascade Layers',
        description: 'Generated rules land in predictable layers, so base styles, components, and utilities keep an intentional override order.',
        image: openLivingImage,
        imageAlt: 'Bright Nordic living room with light wood flooring and white seating',
        layoutClassName: 'grid-col-span:4',
        placementStyle: { gridColumnStart: 5, gridRowStart: 2 }
    },
    {
        id: 'gallery-lounge',
        title: 'Motion Tokens',
        description: 'Transitions and animations share duration and easing tokens, so interactive states keep a consistent product rhythm.',
        image: galleryLoungeImage,
        imageAlt: 'Nordic living room with framed wall art, lounge chairs, and a cream sofa',
        layoutClassName: 'grid-col-span:4',
        placementStyle: { gridColumnStart: 9, gridRowStart: 2 }
    }
] satisfies readonly Artwork[]

function getFrameRect(rect: DOMRect): FrameRect {
    return {
        height: rect.height,
        left: rect.left,
        top: rect.top,
        width: rect.width
    }
}

function getModalImageFrameRect(aspectRatio: number): FrameRect {
    const viewportWidth = window.innerWidth * (aspectRatio >= 1 ? 0.92 : 0.78)
    const width = Math.min(viewportWidth, window.innerHeight * 0.82 * aspectRatio)
    const height = width / aspectRatio

    return {
        height,
        left: (window.innerWidth - width) / 2,
        top: (window.innerHeight - height) / 2,
        width
    }
}

function getModalImageFrameStyle(aspectRatio: number): CSSProperties {
    const viewportWidth = aspectRatio >= 1 ? '92vw' : '78vw'

    return {
        aspectRatio,
        left: '50%',
        position: 'fixed',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        width: `min(${viewportWidth},calc(82dvh*${aspectRatio}))`
    }
}

export default function ArtGalleryPreview({ className }: { className?: string }) {
    const $ = useTranslation()
    const [modalArtworkId, setModalArtworkId] = useState<string>()
    const [modalFrameAspectRatio, setModalFrameAspectRatio] = useState(1.6)
    const [modalVisible, setModalVisible] = useState(false)
    const [imageAnimation, setImageAnimation] = useState<ImageAnimation>()
    const [hiddenGridArtworkId, setHiddenGridArtworkId] = useState<string>()
    const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null)
    const animationFrameRef = useRef<number>()
    const animationTimeoutRef = useRef<ReturnType<typeof setTimeout>>()
    const artworkFrameRefs = useRef<Record<string, HTMLElement | null>>({})
    const closeButtonRef = useRef<HTMLButtonElement>(null)
    const previousFocusRef = useRef<HTMLElement | null>(null)
    const restoreFocusRef = useRef(false)
    const modalArtwork = artworks.find((artwork) => artwork.id === modalArtworkId)
    const animatedArtwork = imageAnimation ? artworks.find((artwork) => artwork.id === imageAnimation.artworkId) : undefined
    const modalActive = Boolean(modalArtwork || hiddenGridArtworkId || imageAnimation)

    const clearAnimationTimers = useCallback(() => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current)
        }
        if (animationTimeoutRef.current) {
            clearTimeout(animationTimeoutRef.current)
        }
    }, [])

    const openArtwork = useCallback((artworkId: string) => {
        const sourceFrame = artworkFrameRefs.current[artworkId]
        if (!sourceFrame) return

        clearAnimationTimers()

        const sourceRect = getFrameRect(sourceFrame.getBoundingClientRect())
        const aspectRatio = sourceRect.width / sourceRect.height
        const targetRect = getModalImageFrameRect(aspectRatio)

        previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
        setModalFrameAspectRatio(aspectRatio)
        setHiddenGridArtworkId(artworkId)
        setModalArtworkId(artworkId)
        setModalVisible(true)
        setImageAnimation({
            active: false,
            artworkId,
            from: sourceRect,
            phase: 'opening',
            to: targetRect
        })

        animationFrameRef.current = requestAnimationFrame(() => {
            setImageAnimation((animation) => animation?.artworkId === artworkId && animation.phase === 'opening'
                ? { ...animation, active: true }
                : animation
            )
        })
        animationTimeoutRef.current = setTimeout(() => {
            setImageAnimation((animation) => animation?.artworkId === artworkId && animation.phase === 'opening' ? undefined : animation)
        }, imageTransitionDuration + 80)
    }, [clearAnimationTimers])

    const closeArtwork = useCallback(() => {
        if (!modalArtworkId) return
        const artworkId = modalArtworkId
        const sourceFrame = artworkFrameRefs.current[artworkId]
        if (!sourceFrame) return

        clearAnimationTimers()
        restoreFocusRef.current = true

        const targetRect = getFrameRect(sourceFrame.getBoundingClientRect())
        const sourceRect = getModalImageFrameRect(modalFrameAspectRatio)

        setModalVisible(false)
        setModalArtworkId(undefined)
        setImageAnimation({
            active: false,
            artworkId,
            from: sourceRect,
            phase: 'closing',
            to: targetRect
        })

        animationFrameRef.current = requestAnimationFrame(() => {
            setImageAnimation((animation) => animation?.artworkId === artworkId && animation.phase === 'closing'
                ? { ...animation, active: true }
                : animation
            )
        })
        animationTimeoutRef.current = setTimeout(() => {
            setImageAnimation((animation) => animation?.artworkId === artworkId && animation.phase === 'closing' ? undefined : animation)
            setHiddenGridArtworkId(undefined)
        }, imageTransitionDuration + 80)
    }, [clearAnimationTimers, modalArtworkId, modalFrameAspectRatio])

    useEffect(() => {
        setPortalTarget(document.body)
    }, [])

    useEffect(() => clearAnimationTimers, [clearAnimationTimers])

    useEffect(() => {
        if (modalArtwork || hiddenGridArtworkId) return

        if (restoreFocusRef.current) {
            restoreFocusRef.current = false
            previousFocusRef.current?.focus()
        }
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
            if (event.key === 'Escape') {
                closeArtwork()
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => {
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [closeArtwork, modalArtwork])

    return (
        <div className={clsx(className, 'h:md h:lg@md')}>
            <div
                className="grid grid-cols:12 items-stretch gap:sm h:full p:md"
                style={{ gridTemplateRows: 'repeat(2, minmax(0, 1fr))' }}>
                {artworks.map((artwork) => {
                    const isHiddenGridArtwork = hiddenGridArtworkId === artwork.id

                    return (
                        <button
                            aria-label={`${$('Open artwork')}: ${$(artwork.title)}`}
                            className={clsx('rel overflow:hidden min-w:0 outline:1px|solid|subtle bg:surface-base transition:background-color|normal|standard cursor:pointer surface:raised:hover group text:left', artwork.layoutClassName)}
                            key={artwork.id}
                            onClick={() => openArtwork(artwork.id)}
                            style={artwork.placementStyle}
                            type="button">
                            <span
                                className={clsx('rel block overflow:hidden size:full', isHiddenGridArtwork && 'invisible')}
                                ref={(node) => {
                                    artworkFrameRefs.current[artwork.id] = node
                                }}>
                                <Image
                                    alt={artwork.imageAlt}
                                    className={clsx('object-center object-cover', artwork.objectPositionClassName)}
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

            {portalTarget && createPortal(
                <div
                    aria-hidden={modalArtwork ? undefined : 'true'}
                    aria-label={modalArtwork ? $(modalArtwork.imageAlt) : undefined}
                    aria-modal={modalArtwork ? 'true' : undefined}
                    className={clsx(
                        'fixed inset:0 z:2147483647',
                        modalVisible ? 'pointer-events:auto' : 'pointer-events:none'
                    )}
                    onPointerDown={(event) => {
                        if (modalArtwork && event.target instanceof Element && !event.target.closest('[data-home-art-modal-content]')) closeArtwork()
                    }}
                    role={modalArtwork ? 'dialog' : undefined}>
                    <div
                        aria-hidden="true"
                        className={clsx('abs inset:0 bg:black/.56 transition:opacity|.48s|smooth', modalVisible ? 'opacity:1' : 'opacity:0')}
                    />
                    <div
                        aria-hidden="true"
                        className={clsx('abs inset:0', modalVisible ? 'opacity:1' : 'opacity:0')}
                        style={{
                            backdropFilter: modalVisible ? 'blur(16px)' : 'blur(0px)',
                            transition: backdropTransition
                        }}
                    />
                    {modalArtwork &&
                        <>
                            <button
                                aria-label={$('Close artwork')}
                                className="abs right:md top:md z:2 grid place-content:center size:9x r:xl outline:1px|solid|subtle surface:overlay transition:background-color|normal|standard surface:raised:hover"
                                data-home-art-modal-content=""
                                onClick={closeArtwork}
                                ref={closeButtonRef}
                                type="button">
                                <IconX aria-hidden="true" className="size:4x stroke:1.75" />
                            </button>

                            <div
                                className={clsx('rel overflow:hidden bg:black shadow:2xl', imageAnimation?.artworkId === modalArtwork.id && imageAnimation.phase === 'opening' && 'opacity:0')}
                                data-home-art-modal-content=""
                                style={getModalImageFrameStyle(modalFrameAspectRatio)}>
                                <Image
                                    alt={modalArtwork.imageAlt}
                                    className={clsx('object-center object-cover', modalArtwork.objectPositionClassName)}
                                    fill
                                    placeholder="blur"
                                    sizes="92vw"
                                    src={modalArtwork.image}
                                />
                            </div>
                        </>
                    }
                    {animatedArtwork && imageAnimation &&
                        <div
                            aria-hidden="true"
                            className="fixed overflow:hidden bg:black shadow:2xl pointer-events:none"
                            data-home-art-transition-clone=""
                            style={{
                                height: imageAnimation.active ? imageAnimation.to.height : imageAnimation.from.height,
                                left: imageAnimation.active ? imageAnimation.to.left : imageAnimation.from.left,
                                top: imageAnimation.active ? imageAnimation.to.top : imageAnimation.from.top,
                                transition: imageAnimation.active ? imageFrameTransition : 'none',
                                width: imageAnimation.active ? imageAnimation.to.width : imageAnimation.from.width,
                                zIndex: 3
                            }}>
                            <Image
                                alt=""
                                className={clsx('object-center object-cover', animatedArtwork.objectPositionClassName)}
                                fill
                                placeholder="blur"
                                sizes="92vw"
                                src={animatedArtwork.image}
                            />
                        </div>
                    }
                </div>,
                portalTarget
            )}
        </div>
    )
}
