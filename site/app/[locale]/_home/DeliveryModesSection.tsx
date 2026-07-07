import {
    IconArrowRight,
    IconBolt,
    IconFileCode,
    IconStack3
} from '@tabler/icons-react'
import type { ComponentType } from 'react'
import clsx from 'clsx'
import Link from '~/internal/components/Link'
import { MotionHoverSurface, MotionSection } from './HomeMotion'
import { deliveryModes, homeSections, sectionBodyClassName, sectionHeadingClassName, sectionLabelClassName, type DeliveryModeContent, type DeliveryModeIconId, type Translate } from './home-content'

const deliveryModeIcons = {
    bolt: IconBolt,
    fileCode: IconFileCode,
    stack: IconStack3
} satisfies Record<DeliveryModeIconId, ComponentType<{ className?: string }>>

export default function DeliveryModesSection({ t }: { t: Translate }) {
    return (
        <MotionSection
            homeSection={homeSections.deliveryModes}
            id={homeSections.deliveryModes}
            className="py:5xl">
            <div className="app-wrapper max-w:breakpoint-2xl">
                <div className="max-w:breakpoint-md">
                    <p className={sectionLabelClassName + ' text:blue'}>{t('Delivery modes')}</p>
                    <h2 className={sectionHeadingClassName}>
                        {t('One syntax. Every delivery path.')}
                    </h2>
                    <p className={sectionBodyClassName}>
                        {t('Start in the browser, build a static CSS asset, or hydrate progressively without changing how teams write classes.')}
                    </p>
                    <Link href="/guide/rendering-modes" className="inline-flex items-center gap:xs mt:lg text-decoration:none text:muted">
                        {t('Compare rendering modes')}
                        <IconArrowRight className="size:4x stroke:1.75" />
                    </Link>
                </div>

                <div className="mt:10x">
                    <DeliveryPipeline t={t} />
                    <div className="grid-cols:1 gap:sm mt:md grid-cols:3@lg">
                        {deliveryModes.map((mode) => (
                            <DeliveryModeCard key={mode.title} mode={mode} t={t} />
                        ))}
                    </div>
                </div>
            </div>
        </MotionSection>
    )
}

function DeliveryPipeline({ t }: { t: Translate }) {
    return (
        <div className="rel overflow:hidden p:md r:xl outline:1px|solid|subtle surface:raised shadow:xs">
            <div className="abs inset:0 opacity:.5 pointer-events:none"
                style={{
                    background: 'linear-gradient(135deg, rgb(59 130 246 / .12), transparent 48%)'
                }} />
            <div className="rel grid gap:md">
                <div className="flex items-center justify-between gap:md">
                    <p className="m:0 font:sm text:strong">{t('Class strings stay the source of truth.')}</p>
                    <span className="px:xs py:2xs r:lg font:xs bg:yellow/.14 text:strong">{t('Portable CSS delivery')}</span>
                </div>
                <div className="grid-cols:1 items-center gap:sm grid-cols:3@md">
                    {[
                        ['class="grid gap:md"', 'Class authoring'],
                        ['MasterCSSManifest', 'Shared IR'],
                        ['style#master-css', 'Delivered CSS']
                    ].map(([code, label], index) => (
                        <div className="contents" key={label}>
                            <div className="min-w:0">
                                <div className={clsx('overflow:hidden px:sm py:xs r:lg font:xs text-ellipsis white-space:nowrap bg:surface-muted text:strong', index === 1 && 'bg:yellow fg:yellow-95')}>
                                    {code}
                                </div>
                                <p className="mx:0 mb:0 mt:xs font:xs text:muted">{t(label)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

function DeliveryModeCard({ mode, t }: { mode: DeliveryModeContent; t: Translate }) {
    const Icon = deliveryModeIcons[mode.icon]

    return (
        <Link href={mode.href} className="block h:full r:xl outline-offset:4xs text-decoration:none outline:2px|solid|yellow:focus-visible">
            <MotionHoverSurface className="flex flex-col h:full min-h:38x p:md r:xl outline:1px|solid|subtle surface:raised shadow:xs">
                <div className="flex items-center justify-between gap:md">
                    <span className={clsx('grid place-content:center size:10x r:xl fg:white', mode.accent)}>
                        <Icon className="size:5x stroke:1.75" />
                    </span>
                    <code className="px:xs py:2xs r:lg font:xs bg:surface-muted text:strong">{t(mode.signal)}</code>
                </div>
                <h3 className="mx:0 mb:0 mt:lg font-weight:560 font:xl text:strong">{t(mode.title)}</h3>
                <p className="mx:0 mb:0 mt:sm leading:1.65 text:muted">{t(mode.body)}</p>
            </MotionHoverSurface>
        </Link>
    )
}
