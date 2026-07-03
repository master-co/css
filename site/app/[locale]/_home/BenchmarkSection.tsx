import { IconArrowRight } from '@tabler/icons-react'
import type { ReactNode } from 'react'
import clsx from 'clsx'
import Link from '~/internal/components/Link'
import { getHomeBrowserCSSCost, type HomeCSSVolumeItem, type HomeDOMScalingItem } from '~/site/utils/home-browser-css-cost'
import { MotionBarFill, MotionSection } from './HomeMotion'
import { benchmarkChartColors, homeInteractions, homeSections, sectionLabelClassName, type Translate } from './home-content'

type Benchmark = ReturnType<typeof getHomeBrowserCSSCost>

export default function BenchmarkSection({
    benchmark,
    t
}: {
    benchmark: Benchmark
    t: Translate
}) {
    return (
        <MotionSection
            homeSection={homeSections.cssCost}
            id={homeSections.cssCost}
            className="rel bb:1px|solid|subtle bt:1px|solid|subtle bg:surface-raised/.26 py:5xl">
            <div className="app-wrapper max-w:breakpoint-2xl">
                <div className="grid-cols:1 gap:2xl grid-cols:12@lg gap:2xl@lg">
                    <div className="grid-col-span:4@lg">
                        <p className={sectionLabelClassName}>{t('CSS cost benchmark')}</p>
                        <h2 className="max-w:12ch mx:0 mb:0 mt:lg font-weight:560 font:34px leading:1.08 tracking:tight text:strong font:6xl@md">
                            {t('Measure the browser cost before making the claim.')}
                        </h2>
                        <p className="mb:0 mt:xl leading:1.75 text:muted">
                            {t('Homepage numbers are read from the committed browser CSS cost snapshot. They calibrate Chromium fixture behavior; the full benchmark page keeps the fixture, limits, and complete tables inspectable.')}
                        </p>
                        <Link href="/guide/benchmarks#browser-css-cost" className="inline-flex items-center gap:xs mt:xl font:medium text-decoration:none text:strong">
                            {t('Read the full benchmark')}
                            <IconArrowRight className="size:4x stroke:1.75" />
                        </Link>
                    </div>

                    <div className="grid-col-span:8@lg">
                        <div className="grid-cols:1 gap:md grid-cols:3@md gap:lg@lg">
                            <EvidenceMetric label={t('CSS levels')} value={String(benchmark.cssLevelCount)} detail={t('Deterministic CSS volume variants')} />
                            <EvidenceMetric label={t('Largest CSS')} value={benchmark.largestCSSLabel} detail={`${benchmark.largestDeclarationsLabel} ${t('declarations')}`} />
                            <EvidenceMetric label={t('Largest DOM')} value={benchmark.largestDOMLabel} detail={t('measured nodes')} />
                        </div>

                        <div className="grid-cols:1 gap:lg mt:lg grid-cols:2@md">
                            <BenchmarkPanel axisLabel={t('Axis: CSS size / declarations')} title={t('CSS volume')} subtitle={t(benchmark.cacheModeLabel)}>
                                <div className="grid gap:sm">
                                    {benchmark.cssVolume.map((item, index) => (
                                        <CSSVolumeRow item={item} key={item.id} t={t} tone={index} />
                                    ))}
                                </div>
                            </BenchmarkPanel>

                            <BenchmarkPanel axisLabel={t('Axis: DOM nodes / render medians')} title={t('DOM scaling')} subtitle={benchmark.browserLabel}>
                                <div className="grid gap:sm">
                                    {benchmark.domScaling.map((item, index) => (
                                        <DOMScalingRow item={item} key={item.id} t={t} tone={index} />
                                    ))}
                                </div>
                            </BenchmarkPanel>
                        </div>
                    </div>
                </div>
            </div>
        </MotionSection>
    )
}

function EvidenceMetric({ detail, label, value }: { detail: string; label: string; value: string }) {
    return (
        <div className="min-h:24x p:sm b:1px|solid|subtle r:md surface:raised min-h:32x@md p:md@md">
            <div className="font:xs text:muted">{label}</div>
            <div className="mt:sm font-weight:580 font:30px leading:1 text:strong">{value}</div>
            <div className="mt:sm font:sm text:muted">{detail}</div>
        </div>
    )
}

function BenchmarkPanel({ axisLabel, children, subtitle, title }: { axisLabel: string; children: ReactNode; subtitle: string; title: string }) {
    return (
        <div className="p:sm b:1px|solid|subtle r:md surface:raised p:md@md">
            <div className="flex items-baseline justify-between gap:md">
                <h3 className="m:0 font-weight:560 font:lg text:strong">{title}</h3>
                <span className="font:xs text:muted">{subtitle}</span>
            </div>
            <div className="flex items-center gap:xs mb:md mt:2xs font:xs leading:1.35 text:muted">
                <span className="h:1px w:8x bg:line-base" />
                <span>{axisLabel}</span>
                <AxisTicks />
            </div>
            {children}
        </div>
    )
}

function AxisTicks() {
    return (
        <span aria-hidden className="flex items-end gap:3xs ml:auto">
            {[4, 6, 4, 8].map((height, index) => (
                <span className="w:1px bg:line-base" key={index} style={{ height }} />
            ))}
        </span>
    )
}

function BenchmarkRowLink({ ariaLabel, children }: { ariaLabel: string; children: ReactNode }) {
    return (
        <Link
            aria-label={ariaLabel}
            data-home-interaction={homeInteractions.benchmarkRow}
            className="grid gap:xs mx:-xs p:xs r:sm outline-offset:2xs text-decoration:none transition:background-color|fast|smooth bg:surface-muted/.28:hover outline:1px|solid|yellow:focus-visible bg:surface-muted/.28:focus-visible"
            href="/guide/benchmarks#browser-css-cost">
            {children}
        </Link>
    )
}

function CSSVolumeRow({ item, t, tone }: { item: HomeCSSVolumeItem; t: Translate; tone: number }) {
    const color = benchmarkChartColors.cssVolume[tone % benchmarkChartColors.cssVolume.length]
    return (
        <BenchmarkRowLink ariaLabel={`${item.label}: ${item.brotliLabel}, ${item.declarationsLabel} ${t('decls')}`}>
            <div className="flex items-baseline justify-between gap:md">
                <span className="overflow:hidden min-w:0 font:medium font:sm text-ellipsis white-space:nowrap text:strong">{item.label}</span>
                <span className="font:xs white-space:nowrap text:muted">{item.brotliLabel} / {item.declarationsLabel} {t('decls')}</span>
            </div>
            <div className="overflow:hidden h:10px r:xs bg:surface-muted">
                <MotionBarFill className={clsx('h:full r:xs', color)} delay={tone * 0.04} percent={item.percent} />
            </div>
        </BenchmarkRowLink>
    )
}

function DOMScalingRow({ item, t, tone }: { item: HomeDOMScalingItem; t: Translate; tone: number }) {
    const color = benchmarkChartColors.domScaling[tone % benchmarkChartColors.domScaling.length]
    return (
        <BenchmarkRowLink ariaLabel={`${item.label}: ${item.nodesLabel} ${t('nodes')}, ${t('Style')} ${item.styleLabel}, ${t('Layout')} ${item.layoutLabel}, ${t('Paint')} ${item.paintLabel}`}>
            <div className="flex items-baseline justify-between gap:md">
                <span className="overflow:hidden min-w:0 font:medium font:sm text-ellipsis white-space:nowrap text:strong">{item.label}</span>
                <span className="font:xs white-space:nowrap text:muted">{item.nodesLabel} {t('nodes')}</span>
            </div>
            <div className="overflow:hidden h:10px r:xs bg:surface-muted">
                <MotionBarFill className={clsx('h:full r:xs', color)} delay={tone * 0.04} percent={item.percent} />
            </div>
            <div className="flex flex-wrap gap:xs|sm font:xs text:muted">
                <span>{t('Style')} {item.styleLabel}</span>
                <span>{t('Layout')} {item.layoutLabel}</span>
                <span>{t('Paint')} {item.paintLabel}</span>
            </div>
        </BenchmarkRowLink>
    )
}
