'use client'

import { useCallback, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import {
    IconArrowsHorizontal,
    IconChevronLeft,
    IconHeart,
    IconMenu2,
    IconSearch,
    IconShoppingBag,
    IconStarFilled,
} from '@tabler/icons-react'
import clsx from 'clsx'

const themeModesDotGridStyle = {
    backgroundImage: 'radial-gradient(var(--color-line-muted) 1px, transparent 1px)',
    backgroundSize: '14px 14px'
}

const minSplit = 0
const maxSplit = 100
const phoneFrameClassName = 'abs left:50% top:2xl h:lg w:92% max-w:sm'

function clampSplit(value: number) {
    return Math.min(maxSplit, Math.max(minSplit, value))
}

export default function ThemeModesPreview({ className }: { className?: string }) {
    const [split, setSplit] = useState(50)
    const frameRef = useRef<HTMLDivElement>(null)

    const updateSplit = useCallback((clientX: number) => {
        const frame = frameRef.current
        if (!frame) return

        const rect = frame.getBoundingClientRect()
        const nextSplit = (clientX - rect.left) / rect.width * 100
        setSplit(clampSplit(nextSplit))
    }, [])

    function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
        event.preventDefault()
        event.currentTarget.setPointerCapture(event.pointerId)
        updateSplit(event.clientX)
    }

    function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            updateSplit(event.clientX)
        }
    }

    function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId)
        }
    }

    function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
        if (event.key === 'ArrowLeft') {
            event.preventDefault()
            setSplit((value) => clampSplit(value - 5))
        } else if (event.key === 'ArrowRight') {
            event.preventDefault()
            setSplit((value) => clampSplit(value + 5))
        } else if (event.key === 'Home') {
            event.preventDefault()
            setSplit(minSplit)
        } else if (event.key === 'End') {
            event.preventDefault()
            setSplit(maxSplit)
        }
    }

    return (
        <div className={clsx(className, 'h:md')}>
            <div aria-hidden="true" className="abs inset:0 opacity:.8 pointer-events:none" style={themeModesDotGridStyle} />
            <div
                aria-label="Preview theme mode split"
                aria-valuemax={maxSplit}
                aria-valuemin={minSplit}
                aria-valuenow={Math.round(split)}
                className="abs inset:0 overflow:hidden user-select:none touch-action:none"
                onKeyDown={handleKeyDown}
                onPointerCancel={handlePointerUp}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                ref={frameRef}
                role="slider"
                tabIndex={0}>
                <div
                    className={phoneFrameClassName}
                    style={{ transform: 'translateX(-50%)' }}>
                    <ShoppingAppMock mode="light" />
                </div>
                <div
                    aria-hidden="true"
                    className="abs inset:0 z:2 overflow:hidden"
                    style={{ clipPath: `inset(0 0 0 ${split}%)` }}>
                    <div
                        className={phoneFrameClassName}
                        style={{ transform: 'translateX(-50%)' }}>
                        <ShoppingAppMock mode="dark" />
                    </div>
                </div>

                <div
                    aria-hidden="true"
                    className="abs bottom:0 top:0 z:3 w:2px bg:cyan shadow:xs"
                    style={{ left: `${split}%`, transform: 'translateX(-50%)' }} />
                <span
                    aria-hidden="true"
                    className="abs top:50% z:4 grid place-content:center size:9x r:xl bg:cyan fg:white shadow:xs"
                    style={{ left: `${split}%`, transform: 'translate(-50%, -50%)' }}>
                    <IconArrowsHorizontal className="size:4x stroke:1.75" />
                </span>
            </div>
        </div>
    )
}

function ShoppingAppMock({ mode }: { mode: 'light' | 'dark' }) {
    const dark = mode === 'dark'

    return (
        <div className={clsx('abs inset:0', dark ? 'dark' : 'light')}>
            <div
                className={clsx(
                    'abs inset:0 overflow:hidden r:3xl outline:1px|solid|subtle surface:base text:strong shadow:card',
                    dark && 'outline:1px|solid|white/.12'
                )}>
                <div
                    aria-hidden="true"
                    className={clsx(
                        'abs inset:0',
                        dark
                            ? 'bg:radial-gradient(80%|42%_at_50%_0%,blue/.10,transparent_62%)'
                            : 'bg:linear-gradient(180deg,amber/.08,transparent_38%)'
                    )} />

                <div className="rel z:1 flex flex-col h:full p:xl">
                    <div className="flex items-center justify-between">
                        <span className={clsx('grid place-content:center size:9x r:xl outline:1px|solid|subtle surface:raised', dark && 'outline:1px|solid|white/.12')}>
                            <IconChevronLeft className="size:4x stroke:1.75" />
                        </span>
                        <span className={clsx('grid place-content:center size:9x r:xl outline:1px|solid|subtle surface:raised', dark && 'outline:1px|solid|white/.12')}>
                            <IconShoppingBag className="size:4x stroke:1.75" />
                        </span>
                    </div>

                    <div className="mt:2xl">
                        <p className={clsx('m:0 font:2xs font:mono tracking:wider uppercase', dark ? 'opacity:.56' : 'text:muted')}>Sunday drop</p>
                        <h4 className="mx:0 mb:0 mt:2xs font:2xl leading:1.05 text:strong">Find your daily kit.</h4>
                    </div>

                    <div className={clsx('flex items-center gap:sm mt:xl px:md py:sm r:xl outline:1px|solid|subtle surface:raised', dark && 'outline:1px|solid|white/.12')}>
                        <IconSearch className={clsx('size:3.5x stroke:1.75', dark ? 'opacity:.56' : 'text:muted')} />
                        <span className={clsx('font:2xs', dark ? 'opacity:.56' : 'text:muted')}>Search products</span>
                    </div>

                    <div className="grid grid-cols:2 gap:md mt:xl">
                        <ProductTile
                            dark={dark}
                            label="Day pack"
                            price="$84" />
                        <ProductTile
                            dark={dark}
                            label="Runner"
                            price="$128" />
                    </div>

                    <div className={clsx('mt:xl p:md r:2xl outline:1px|solid|subtle surface:muted', dark && 'outline:1px|solid|white/.12')}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={clsx('m:0 font:2xs font:mono tracking:wider uppercase', dark ? 'opacity:.56' : 'text:muted')}>Cart preview</p>
                                <p className="mx:0 mb:0 mt:1px font:sm text:strong">2 items ready</p>
                            </div>
                            <span className="grid place-content:center size:9x r:xl outline:1px|solid|subtle surface:raised">
                                <IconMenu2 className="size:4x stroke:1.75" />
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols:2 gap:md mt:xl">
                        <ProductTile
                            dark={dark}
                            label="Cup"
                            price="$32" />
                        <ProductTile
                            dark={dark}
                            label="Tote bag"
                            price="$46" />
                    </div>
                </div>
            </div>
        </div>
    )
}

function ProductTile({
    dark,
    label,
    price
}: {
    dark: boolean
    label: string
    price: string
}) {
    return (
        <div className={clsx('overflow:hidden p:sm r:2xl outline:1px|solid|subtle surface:raised', dark && 'outline:1px|solid|white/.12')}>
            <div className="rel overflow:hidden h:14x r:xl surface:muted">
                <span className="abs right:xs top:xs grid place-content:center size:5x r:lg surface:overlay">
                    <IconHeart className="size:3x stroke:1.75" />
                </span>
            </div>
            <div className="flex items-start justify-between gap:sm mt:sm">
                <div className="min-w:0">
                    <p className="overflow:hidden m:0 font:2xs font:medium text-ellipsis white-space:nowrap text:strong">{label}</p>
                    <span className={clsx('inline-flex items-center gap:1px font:2xs', dark ? 'opacity:.56' : 'text:muted')}>
                        <IconStarFilled className="size:2.5x text:amber opacity:.62" />
                        4.9
                    </span>
                </div>
                <span className="font:2xs font:mono text:strong">{price}</span>
            </div>
        </div>
    )
}
