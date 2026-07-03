import {
    IconArrowRight,
    IconCode,
    IconDeviceDesktopAnalytics,
    IconLayersIntersect,
    IconPalette,
    IconSparkles,
    IconTools
} from '@tabler/icons-react'
import type { ComponentType, ReactNode } from 'react'
import clsx from 'clsx'
import Link from '~/internal/components/Link'
import { MotionHoverSurface, MotionSection, MotionVisualFrame } from './HomeMotion'
import { bentoTiles, homeInteractions, homeSections, sectionLabelClassName, type BentoIconId, type BentoTileContent, type BentoVisualType, type Translate } from './home-content'

const bentoIcons = {
    code: IconCode,
    desktop: IconDeviceDesktopAnalytics,
    layers: IconLayersIntersect,
    palette: IconPalette,
    sparkles: IconSparkles,
    tools: IconTools
} satisfies Record<BentoIconId, ComponentType<{ className?: string }>>

export default function BentoSection({ t }: { t: Translate }) {
    return (
        <MotionSection homeSection={homeSections.designSystem} id={homeSections.designSystem} className="py:5xl">
            <div className="app-wrapper max-w:breakpoint-2xl">
                <div className="max-w:breakpoint-md">
                    <p className={sectionLabelClassName}>{t('Modern web design system')}</p>
                    <h2 className="mx:0 mb:0 mt:md font-weight:560 font:34px leading:1.08 tracking:tight text:strong font:6xl@md">
                        {t('A complete styling system, compressed into class strings.')}
                    </h2>
                    <p className="max-w:70ch mb:0 mt:lg leading:1.7 text:muted">
                        {t('The homepage bento is intentionally made from real product primitives: layout, tokens, conditions, delivery, and tooling. Each tile links to the documentation that owns the capability.')}
                    </p>
                </div>

                <div className="grid-cols:1 gap:md mt:10x grid-cols:2@md grid-cols:12@lg">
                    {bentoTiles.map((tile) => (
                        <BentoTile key={tile.title} tile={tile} t={t} />
                    ))}
                </div>
            </div>
        </MotionSection>
    )
}

function BentoTile({ t, tile }: { t: Translate; tile: BentoTileContent }) {
    const Icon = bentoIcons[tile.icon]
    return (
        <Link
            data-home-interaction={homeInteractions.bentoTile}
            href={tile.href}
            className={clsx(
                'rel block min-h:52x r:md outline-offset:4xs text-decoration:none outline:2px|solid|yellow:focus-visible',
                tile.span
            )}>
            <MotionHoverSurface className="rel flex overflow:hidden flex-col h:full min-h:52x p:md b:1px|solid|subtle r:md surface:raised shadow:xs">
                <div className="abs inset:0 opacity:.48 pointer-events:none"
                    style={{
                        background: 'linear-gradient(135deg, rgb(250 204 21 / .12), transparent 42%)'
                    }} />
                <div
                    className="abs inset:0 opacity:.5 pointer-events:none"
                    style={{
                        boxShadow: 'inset 0 1px rgb(255 255 255 / .12), inset 0 0 0 1px rgb(250 204 21 / .04)'
                    }} />
                <div className="flex items-center justify-between gap:md">
                    <span className={clsx('grid place-content:center size:10x r:md fg:white', tile.accent)}>
                        <Icon className="size:5x stroke:1.75" />
                    </span>
                    <IconArrowRight className="size:4x text:muted" />
                </div>
                <MotionVisualFrame>
                    <BentoVisual accent={tile.accent} type={tile.visual} />
                </MotionVisualFrame>
                <h3 className="mx:0 mb:0 mt:lg font-weight:560 font:xl text:strong">{t(tile.title)}</h3>
                <p className="mx:0 mb:0 mt:sm leading:1.65 text:muted">{t(tile.body)}</p>
                <div className="flex flex-wrap gap:xs mt:auto pt:lg">
                    {tile.sample.map((sample) => (
                        <code className="px:xs py:2xs r:sm font:xs bg:surface-muted text:strong" key={sample}>{sample}</code>
                    ))}
                </div>
            </MotionHoverSurface>
        </Link>
    )
}

function BentoVisual({ accent, type }: { accent: string; type: BentoVisualType }) {
    let content: ReactNode

    if (type === 'markup') {
        content = (
            <div className="grid gap:xs">
                {['w:64%', 'w:82%', 'w:48%'].map((width, index) => (
                    <div className="flex items-center gap:xs" key={width}>
                        <span className={clsx('size:2x r:xs', index === 1 ? accent : 'bg:line-base')} />
                        <span className={clsx('h:2x r:xs bg:surface-muted', width)} />
                    </div>
                ))}
            </div>
        )
    } else if (type === 'tokens') {
        content = (
            <div className="grid-cols:3 gap:xs">
                {['bg:surface-base', 'bg:surface-raised', accent].map((color, index) => (
                    <div className={clsx('h:14x r:md outline:1px|solid|subtle', color)} key={index}>
                        <div className={clsx('h:2x m:xs r:xs', index === 2 ? 'bg:white/.7' : 'bg:line-base')} />
                    </div>
                ))}
            </div>
        )
    } else if (type === 'responsive') {
        content = (
            <div className="grid gap:xs">
                {[42, 68, 88].map((width, index) => (
                    <div className="flex items-center gap:xs" key={width}>
                        <span className="font:xs text:muted">{index === 0 ? 'sm' : index === 1 ? 'md' : 'lg'}</span>
                        <div className="flex:1 h:2x r:xs bg:surface-muted">
                            <div className={clsx('h:full r:xs', index === 2 ? accent : 'bg:blue')} style={{ width: `${width}%` }} />
                        </div>
                    </div>
                ))}
            </div>
        )
    } else if (type === 'states') {
        content = (
            <div className="grid-cols:3 gap:xs">
                {['base', ':hover', '@dark'].map((label, index) => (
                    <div className={clsx('grid place-content:center h:14x r:md font:xs bg:surface-muted text:muted', index === 1 && accent, index === 1 && 'fg:white')} key={label}>
                        {label}
                    </div>
                ))}
            </div>
        )
    } else if (type === 'delivery') {
        content = (
            <div className="flex items-center gap:xs">
                {['HTML', 'CSS', 'Runtime'].map((label, index) => (
                    <div className="contents" key={label}>
                        <div className={clsx('px:xs py:2xs r:sm font:xs bg:surface-muted text:strong', index === 1 && accent, index === 1 && 'fg:white')}>{label}</div>
                        {index < 2 && <div className="flex:1 h:1px bg:line-base" />}
                    </div>
                ))}
            </div>
        )
    } else {
        content = (
            <div className="grid gap:xs">
                {[
                    ['completion', 'bg:green'],
                    ['diagnostic', 'bg:yellow'],
                    ['sorted', accent]
                ].map(([label, color]) => (
                    <div className="flex items-center gap:xs" key={label}>
                        <span className={clsx('size:2x round', color)} />
                        <span className="font:xs text:muted">{label}</span>
                        <span className="h:2x w:20x ml:auto r:xs bg:surface-muted" />
                    </div>
                ))}
            </div>
        )
    }

    return <div className="grid content-center min-h:16x mt:lg">{content}</div>
}
