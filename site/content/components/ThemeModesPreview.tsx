'use client'

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { IconArrowsHorizontal, IconChevronLeft, IconHeart, IconMenu2, IconSearch, IconShoppingBag, IconStarFilled } from '@tabler/icons-react'
import clsx from 'clsx'
import { useInView } from 'react-intersection-observer'
import { useMediaQuery } from 'usehooks-ts'
import { useTranslation } from '~/site/docs-shell/contexts/i18n'

const minSplit = 0
const maxSplit = 100
const surfaceClassName = 'outline-width:1px outline-style:solid outline-line-subtle bg-surface-raised'
const iconButtonClassName = 'display:grid place-content:center width:2.25rem height:2.25rem r-xl'

/** Split positions the first sweep passes through, as [time, split] keyframes in milliseconds. */
const sweep = [[0, 50], [900, 18], [2100, 82], [2900, 50]] as const

function clampSplit(value: number) {
  return Math.min(maxSplit, Math.max(minSplit, value))
}

function sweepAt(time: number) {
  const index = sweep.findIndex(([at]) => at >= time)
  if (index <= 0) return index === 0 ? sweep[0][1] : sweep.at(-1)![1]
  const [startTime, from] = sweep[index - 1]
  const [endTime, to] = sweep[index]
  const progress = (time - startTime) / (endTime - startTime)
  return from + (to - from) * (0.5 - Math.cos(progress * Math.PI) / 2)
}

/** A light and dark rendering of the same markup, compared with a draggable split. */
export default function ThemeModesPreview({ className }: { className?: string }) {
  const $ = useTranslation()
  const [split, setSplit] = useState(50)
  const frameRef = useRef<HTMLDivElement>(null)
  const interactedRef = useRef(false)
  const { ref, inView } = useInView({ threshold: 0.6, triggerOnce: true })
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)', { initializeWithValue: false })

  // Sweep once when the preview first comes into view, unless someone already moved it.
  useEffect(() => {
    if (!inView || reduceMotion || interactedRef.current) return
    let frame = 0
    let startedAt = 0
    const step = (timestamp: number) => {
      if (interactedRef.current) return
      startedAt ||= timestamp
      const elapsed = timestamp - startedAt
      setSplit(sweepAt(elapsed))
      if (elapsed < sweep.at(-1)![0]) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [inView, reduceMotion])

  const updateSplit = useCallback((clientX: number) => {
    const frame = frameRef.current
    if (!frame) return
    const rect = frame.getBoundingClientRect()
    setSplit(clampSplit((clientX - rect.left) / rect.width * 100))
  }, [])

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    interactedRef.current = true
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    updateSplit(event.clientX)
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) updateSplit(event.clientX)
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const next = { ArrowLeft: split - 5, ArrowRight: split + 5, Home: minSplit, End: maxSplit }[event.key]
    if (next === undefined) return
    interactedRef.current = true
    event.preventDefault()
    setSplit(clampSplit(next))
  }

  return (
    <div className={className} ref={ref}>
      <div aria-hidden="true" className="position:absolute inset:0 opacity:0.8 pointer-events:none home-dot-grid" />
      <div
        aria-label={$('Preview theme mode split')}
        aria-valuemax={maxSplit}
        aria-valuemin={minSplit}
        aria-valuenow={Math.round(split)}
        className="position:absolute inset:0 overflow:hidden user-select:none touch-action:none"
        onKeyDown={handleKeyDown}
        onPointerCancel={handlePointerUp}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        ref={frameRef}
        role="slider"
        tabIndex={0}>
        <div aria-hidden="true" className="position:absolute inset:0 z-index:1 overflow:hidden" style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}>
          <ShoppingAppMock mode="light" />
        </div>
        <div aria-hidden="true" className="position:absolute inset:0 z-index:2 overflow:hidden" style={{ clipPath: `inset(0 0 0 ${split}%)` }}>
          <ShoppingAppMock mode="dark" />
        </div>
        <div aria-hidden="true" className="position:absolute bottom:0 top:0 z-index:3 width:1px bg-surface-inverse/0.6 translate:-50%" style={{ left: `${split}%` }} />
        <span aria-hidden="true" className="position:absolute top:50% z-index:4 display:grid place-content:center height:2.25rem width:2.25rem r-pill bg-surface-inverse fg-text-inverse shadow-md translate:-50%|-50%" style={{ left: `${split}%` }}>
          <IconArrowsHorizontal size={16} stroke={1.75} />
        </span>
      </div>
    </div>
  )
}

function ShoppingAppMock({ mode }: { mode: 'light' | 'dark' }) {
  const dark = mode === 'dark'
  const subtleClassName = dark ? 'opacity:0.56' : 'fg-text-muted'
  const panelClassName = clsx(surfaceClassName, dark && 'outline-white/0.12')
  return (
    <div className={clsx('position:absolute top-2xl left:50% h-lg width:92% max-w-sm translate:-50%', mode)}>
      <div className="position:absolute inset:0 overflow:hidden r-3xl bg-surface-base fg-text-strong shadow-lg">
        <div className="position:relative display:flex flex-direction:column height:100% p-xl">
          <div className="display:flex align-items:center justify-content:space-between">
            <span className={clsx(iconButtonClassName, panelClassName)}>
              <IconChevronLeft size={16} stroke={1.75} />
            </span>
            <span className={clsx(iconButtonClassName, panelClassName)}>
              <IconShoppingBag size={16} stroke={1.75} />
            </span>
          </div>
          <div className="mt-2xl">
            <p className={clsx('font-mono font-2xs tracking-wider text-transform:uppercase', subtleClassName)}>Sunday drop</p>
            <h4 className="mt-2xs font-2xl line-height:1.05 fg-text-strong">Find your daily kit.</h4>
          </div>
          <div className={clsx('display:flex align-items:center gap-sm mt-xl py-sm px-md r-xl', panelClassName)}>
            <IconSearch className={subtleClassName} size={14} stroke={1.75} />
            <span className={clsx('font-2xs', subtleClassName)}>Search products</span>
          </div>
          <div className="grid-cols(2) gap-md mt-xl">
            <ProductTile dark={dark} label="Day pack" price="$84" />
            <ProductTile dark={dark} label="Runner" price="$128" />
          </div>
          <div className={clsx('mt-xl p-md r-2xl outline-line-subtle outline-style:solid outline-width:1px bg-surface-inset', dark && 'outline-white/0.12')}>
            <div className="display:flex align-items:center justify-content:space-between">
              <div>
                <p className={clsx('font-mono font-2xs tracking-wider text-transform:uppercase', subtleClassName)}>Cart preview</p>
                <p className="margin-top:1px font-sm fg-text-strong">2 items ready</p>
              </div>
              <span className={clsx(iconButtonClassName, surfaceClassName)}>
                <IconMenu2 size={16} stroke={1.75} />
              </span>
            </div>
          </div>
          <div className="grid-cols(2) gap-md mt-xl">
            <ProductTile dark={dark} label="Cup" price="$32" />
            <ProductTile dark={dark} label="Tote bag" price="$46" />
          </div>
        </div>
      </div>
    </div>
  )
}

function ProductTile({ dark, label, price }: { dark: boolean, label: string, price: string }) {
  return (
    <div className={clsx('overflow:hidden p-sm r-2xl', surfaceClassName, dark && 'outline-white/0.12')}>
      <div className="position:relative overflow:hidden height:3.5rem r-xl bg-surface-inset">
        <span className="position:absolute right-xs top-xs display:grid place-content:center height:1.25rem width:1.25rem r-lg bg-surface-floating">
          <IconHeart size={12} stroke={1.75} />
        </span>
      </div>
      <div className="display:flex align-items:flex-start justify-content:space-between gap-sm mt-sm">
        <div className="min-width:0">
          <p className="overflow:hidden font-2xs font-medium text-overflow:ellipsis white-space:nowrap fg-text-strong">{label}</p>
          <span className={clsx('display:inline-flex align-items:center gap:1px font-2xs', dark ? 'opacity:0.56' : 'fg-text-muted')}>
            <IconStarFilled className="fg-text-amber opacity:0.62" size={10} stroke={1.75} />
            4.9
          </span>
        </div>
        <span className="font-mono font-2xs fg-text-strong">{price}</span>
      </div>
    </div>
  )
}
