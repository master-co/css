'use client'

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import { IconBackpack, IconChevronLeft, IconShoe, IconShoppingBag } from '@tabler/icons-react'
import clsx from 'clsx'
import { useTranslation } from '~/site/docs-shell/contexts/i18n'
import { mountThemeSplit } from './theme-split'

/**
 * A light and dark rendering of the same markup on one artboard, compared with a draggable split.
 * The split is measured across the artboard, so the share it reports is the share of the screen each mode paints.
 */
export default function ThemeModesPreview({ className }: { className?: string }) {
  const $ = useTranslation()
  const rootRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)

  useEffect(() => mountThemeSplit(rootRef.current!, frameRef.current!, (light, dark) => `${$('Light')} ${light}%, ${$('Dark')} ${dark}%`), [$])

  return (
    <div className={clsx(className, 'home-dot-grid home-theme')} ref={rootRef}>
      <div
        aria-label={$('Preview theme mode split')}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={50}
        aria-valuetext={`${$('Light')} 50%, ${$('Dark')} 50%`}
        className="home-theme-slider"
        role="slider"
        style={{ '--home-split': '50%' } as CSSProperties}
        tabIndex={0}>
        {/* An artboard: the class each copy carries above it, corner marks around it, the split measured below it. */}
        <div aria-hidden="true" className="home-theme-board">
          <p className="home-theme-labels"><code>.light</code><code>.dark</code></p>
          <div className="home-marks home-theme-artboard" ref={frameRef}>
            <div className="home-theme-copy home-theme-copy-light"><ShopScreen mode="light" /></div>
            <div className="home-theme-copy home-theme-copy-dark"><ShopScreen mode="dark" /></div>
            <span className="home-theme-divider" />
            <span className="home-lit home-stone home-stone-quiet home-theme-knob" suppressHydrationWarning />
          </div>
          <p className="home-theme-measure">
            <span className="home-theme-measure-label" style={{ left: '25%' }}>50%</span>
            <span className="home-theme-measure-label" style={{ left: '75%' }}>50%</span>
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
      <div className="flex flex-col gap-md p-lg r-3xl bg-surface-base fg-text-strong">
        <div className="flex items-center justify-between (height:var(--spacing-xl))">
          <IconChevronLeft size={18} stroke={1.75} />
          <span className="font-sm font-medium">{$('Shop')}</span>
          <span className="relative grid">
            <IconShoppingBag size={18} stroke={1.75} />
            <span className="absolute (right:-0.125rem) (top:-0.125rem) (height:0.4375rem) (width:0.4375rem) pill bg-surface-inverse" />
          </span>
        </div>
        <div>
          <p className="font-mono font-2xs tracking-wider uppercase fg-text-muted">{$('Sunday drop')}</p>
          <p className="mt-2xs font-2xl (line-height:1.1) tracking-tight fg-text-strong">{$('Find your daily kit.')}</p>
        </div>
        <div className="flex items-center gap-md font-xs">
          <span className="inline-flex items-center (height:1.75rem) px-sm pill font-medium bg-surface-inverse fg-text-inverse">{$('All')}</span>
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
    <div className="min-w(0)">
      <div className="grid (place-content:center) (height:5rem) r-xl bg-surface-inset fg-text-muted">{icon}</div>
      <div className="flex items-baseline justify-between gap-xs mt-xs">
        <p className="truncate font-xs font-medium fg-text-strong">{label}</p>
        <span className="font-mono font-2xs fg-text-muted">{price}</span>
      </div>
    </div>
  )
}
