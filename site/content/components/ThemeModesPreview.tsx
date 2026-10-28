'use client'

import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import { IconBackpack, IconChevronLeft, IconShoe, IconShoppingBag } from '@tabler/icons-react'
import clsx from 'clsx'
import { useInView } from 'react-intersection-observer'
import { useMediaQuery } from 'usehooks-ts'
import { useTranslation } from '~/site/docs-shell/contexts/i18n'
import { surfaceModeValues } from './design-system-content'

const minSplit = 0
const maxSplit = 100

/** Split positions the first sweep passes through, as [time, split] keyframes in milliseconds. */
const sweep = [[0, 50], [1100, 22], [2500, 78], [3400, 50]] as const

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

/** A segment of the measurement under the artboard keeps its label only when it is wide enough to hold it. */
const minLabeledShare = 16

/**
 * A light and dark rendering of the same markup on one artboard, compared with a draggable split.
 * The split is measured across the artboard, so the share it reports is the share of the screen each mode paints.
 */
export default function ThemeModesPreview({ className }: { className?: string }) {
  const $ = useTranslation()
  const [split, setSplit] = useState(50)
  const [dragging, setDragging] = useState(false)
  const frameRef = useRef<HTMLDivElement>(null)
  const interactedRef = useRef(false)
  const { ref, inView } = useInView({ threshold: 0.6, triggerOnce: true })
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)', { initializeWithValue: false })
  const rowRef = useRef<HTMLElement | null>(null)
  const tokenLinesRef = useRef<HTMLElement[]>([])

  // The token card beside this one declares both values; find their lines once.
  useEffect(() => {
    rowRef.current = frameRef.current?.closest<HTMLElement>('.home-bento-grid') ?? null
    const lines = [...rowRef.current?.querySelectorAll<HTMLElement>('.home-tokens-code .line') ?? []]
    tokenLinesRef.current = surfaceModeValues.map(({ value }) => lines.find((line) => line.textContent?.includes(value))!).filter(Boolean)
  }, [])

  // Each value lights up as much as its mode fills the preview, so dragging shows which value is in use.
  useEffect(() => {
    const share = split / 100
    const [light, dark] = tokenLinesRef.current
    light?.style.setProperty('--home-token-share', share.toFixed(3))
    dark?.style.setProperty('--home-token-share', (1 - share).toFixed(3))
  }, [split])

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
    if (event.button !== 0) return
    interactedRef.current = true
    // No preventDefault: the press focuses the slider the browser's way, so a pointer never shows the keyboard ring.
    event.currentTarget.setPointerCapture(event.pointerId)
    setDragging(true)
    updateSplit(event.clientX)
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) updateSplit(event.clientX)
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    setDragging(false)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const next = { ArrowLeft: split - 5, ArrowDown: split - 5, ArrowRight: split + 5, ArrowUp: split + 5, PageDown: split - 20, PageUp: split + 20, Home: minSplit, End: maxSplit }[event.key]
    if (next === undefined) return
    interactedRef.current = true
    event.preventDefault()
    setSplit(clampSplit(Math.round(next)))
  }

  const lightShare = Math.round(split)
  const darkShare = 100 - lightShare
  return (
    <div className={clsx(className, 'home-dot-grid home-theme')} data-dragging={dragging || undefined} ref={ref}>
      <div
        aria-label={$('Preview theme mode split')}
        aria-valuemax={maxSplit}
        aria-valuemin={minSplit}
        aria-valuenow={lightShare}
        aria-valuetext={`${$('Light')} ${lightShare}%, ${$('Dark')} ${100 - lightShare}%`}
        className="home-theme-slider"
        onKeyDown={handleKeyDown}
        onLostPointerCapture={() => setDragging(false)}
        onPointerCancel={handlePointerUp}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        role="slider"
        style={{ '--home-split': `${split}%` } as CSSProperties}
        tabIndex={0}>
        {/* An artboard: the class each copy carries above it, corner marks around it, the split measured below it. */}
        <div aria-hidden="true" className="home-theme-board">
          <p className="home-theme-labels"><code>.light</code><code>.dark</code></p>
          <div className="home-marks home-theme-artboard" ref={frameRef}>
            <div className="home-theme-copy home-theme-copy-light"><ShopScreen mode="light" /></div>
            <div className="home-theme-copy home-theme-copy-dark"><ShopScreen mode="dark" /></div>
            <span className="home-theme-divider" />
            <span className="home-theme-knob" />
          </div>
          <p className="home-theme-measure">
            <span className="home-theme-measure-label" style={{ left: `${split / 2}%` }}>{lightShare >= minLabeledShare && `${lightShare}%`}</span>
            <span className="home-theme-measure-label" style={{ left: `${split + (100 - split) / 2}%` }}>{darkShare >= minLabeledShare && `${darkShare}%`}</span>
          </p>
        </div>
      </div>
    </div>
  )
}

/** The same markup in both copies; only the `light` or `dark` class on its root differs. */
function ShopScreen({ mode }: { mode: 'light' | 'dark' }) {
  const $ = useTranslation()
  return (
    <div className={clsx('home-theme-screen', mode)}>
      <div className="display:flex flex-direction:column gap-md p-lg r-3xl bg-surface-base fg-text-strong">
        <div className="display:flex align-items:center justify-content:space-between height:2rem">
          <IconChevronLeft size={18} stroke={1.75} />
          <span className="font-sm font-medium">{$('Shop')}</span>
          <span className="position:relative display:grid">
            <IconShoppingBag size={18} stroke={1.75} />
            <span className="position:absolute right:-0.125rem top:-0.125rem height:0.4375rem width:0.4375rem r-pill bg-surface-inverse" />
          </span>
        </div>
        <div>
          <p className="font-mono font-2xs tracking-wider text-transform:uppercase fg-text-muted">{$('Sunday drop')}</p>
          <p className="mt-2xs font-2xl line-height:1.1 tracking-tight fg-text-strong">{$('Find your daily kit.')}</p>
        </div>
        <div className="display:flex align-items:center gap-md font-xs">
          <span className="display:inline-flex align-items:center height:1.75rem px-sm r-pill font-medium bg-surface-inverse fg-text-inverse">{$('All')}</span>
          <span className="fg-text-muted">{$('Bags')}</span>
          <span className="fg-text-muted">{$('Shoes')}</span>
        </div>
        <div className="grid-cols(2) gap-sm">
          <Product icon={<IconBackpack size={26} stroke={1.25} />} label={$('Day pack')} price="$84" />
          <Product icon={<IconShoe size={26} stroke={1.25} />} label={$('Runner')} price="$128" />
        </div>
      </div>
    </div>
  )
}

/** A product as a picture and a line of text, with no card around it. */
function Product({ icon, label, price }: { icon: ReactNode, label: string, price: string }) {
  return (
    <div className="min-width:0">
      <div className="display:grid place-content:center height:5rem r-xl bg-surface-inset fg-text-muted">{icon}</div>
      <div className="display:flex align-items:baseline justify-content:space-between gap-xs mt-xs">
        <p className="overflow:hidden font-xs font-medium text-overflow:ellipsis white-space:nowrap fg-text-strong">{label}</p>
        <span className="font-mono font-2xs fg-text-muted">{price}</span>
      </div>
    </div>
  )
}
