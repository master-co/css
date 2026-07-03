'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, useInView, useReducedMotion } from 'motion/react'
import clsx from 'clsx'
import brands from '~/internal/data/brands'
import type { getHomePageCSSSize, HomePageCSSSizeMode, HomePageCSSSizeModeId, HomePageCSSSizeRow } from '~/site/utils/home-page-css-size'

type PageCSSSize = ReturnType<typeof getHomePageCSSSize>

type BenchmarkSizeChartLabels = {
    largerSuffix: string
    modeLabels: Record<HomePageCSSSizeModeId, string>
}

const barDuration = 0.82
const rowDelayStep = 0.085

const brandColorClasses: Record<string, string> = {
    beryl: 'bg:green',
    blue: 'bg:blue',
    cyan: 'bg:cyan',
    gray: 'bg:slate-50@light bg:slate-70@dark',
    green: 'bg:green',
    orange: 'bg:orange',
    pink: 'bg:red',
    purple: 'bg:purple',
    sky: 'bg:blue',
    yellow: 'bg:yellow'
}

export default function BenchmarkSizeChart({
    labels,
    pageCSSSize
}: {
    labels: BenchmarkSizeChartLabels
    pageCSSSize: PageCSSSize
}) {
    const [activeModeId, setActiveModeId] = useState<HomePageCSSSizeModeId>('brotli')
    const [showValues, setShowValues] = useState(false)
    const chartRef = useRef<HTMLDivElement>(null)
    const reduceMotion = useReducedMotion()
    const inView = useInView(chartRef, { once: true, amount: 0.34 })
    const activeMode = useMemo(
        () => pageCSSSize.modes.find((mode) => mode.id === activeModeId) || pageCSSSize.modes[0],
        [activeModeId, pageCSSSize.modes]
    )
    const revealDelay = (activeMode.rows.length - 1) * rowDelayStep + barDuration + 0.12

    useEffect(() => {
        if (reduceMotion) {
            setShowValues(true)
            return
        }

        setShowValues(false)
        if (!inView) return

        const timeout = window.setTimeout(() => setShowValues(true), revealDelay * 1000)
        return () => window.clearTimeout(timeout)
    }, [activeModeId, inView, reduceMotion, revealDelay])

    return (
        <div ref={chartRef} className="rel py:md">
            <div className="flex flex-col gap:lg">
                <div className="flex w:fit p:5px r:lg surface:muted">
                    {pageCSSSize.modes.map((mode) => {
                        const active = mode.id === activeMode.id
                        return (
                            <button
                                aria-pressed={active}
                                className={clsx(
                                    'h:9x px:md r:sm outline-offset:2xs font:sm transition:background-color|fast|smooth,color|fast|smooth outline:2px|solid|yellow:focus-visible',
                                    active ? 'surface:raised text:strong shadow:xs' : 'text:muted text:strong:hover'
                                )}
                                key={mode.id}
                                onClick={() => setActiveModeId(mode.id)}
                                type="button">
                                {labels.modeLabels[mode.id]}
                            </button>
                        )
                    })}
                </div>

                <div className="grid gap:2xs" key={activeMode.id}>
                    {activeMode.rows.map((row, index) => (
                        <PageCSSSizeRow
                            inView={inView}
                            index={index}
                            key={row.name}
                            labels={labels}
                            reduceMotion={Boolean(reduceMotion)}
                            row={row}
                            showValues={showValues} />
                    ))}
                </div>
            </div>
        </div>
    )
}

function PageCSSSizeRow({
    inView,
    index,
    labels,
    reduceMotion,
    row,
    showValues
}: {
    inView: boolean
    index: number
    labels: BenchmarkSizeChartLabels
    reduceMotion: boolean
    row: HomePageCSSSizeRow
    showValues: boolean
}) {
    const brand = Object.values(brands).find((eachBrand) => eachBrand.name === row.name)
    const BrandIcon = brand?.src
    const colorClassName = row.isMasterCSS ? 'bg:yellow' : brandColorClasses[brand?.color || ''] || 'bg:blue'
    const markerPercent = Math.max(0, Math.min(100, row.percent))
    const ratioLabel = `${row.ratio.toFixed(1)}${labels.largerSuffix}`

    return (
        <div className="py:0">
            <div className="rel min-h:10x">
                <div className="rel h:10x w:30% w:60%@md w:72%@lg">
                    <motion.div
                        animate={{ width: reduceMotion || inView ? `${row.percent}%` : '100%' }}
                        className={clsx('abs inset:50%|auto|auto|0 h:10px min-w:1px r:xs transform:translateY(-50%)', colorClassName)}
                        data-home-bar-fill
                        initial={reduceMotion ? false : { width: '100%' }}
                        transition={{ delay: index * rowDelayStep, duration: barDuration, ease: [0.22, 1, 0.36, 1] }} />
                    <motion.span
                        animate={{ left: reduceMotion || inView ? `${markerPercent}%` : '100%' }}
                        className="abs top:50% z:1 inline-flex items-center gap:2xs white-space:nowrap pointer-events:none gap:xs@md"
                        data-home-marker
                        initial={reduceMotion ? false : { left: '100%' }}
                        style={{ transform: 'translate(0, -50%)' }}
                        transition={{ delay: index * rowDelayStep, duration: barDuration, ease: [0.22, 1, 0.36, 1] }}>
                        <span className="grid flex:0|0|auto place-content:center size:7x r:sm outline:1px|solid|subtle bg:surface-base shadow:xs size:8x@md">
                            {BrandIcon && <BrandIcon width={20} height={20} className={clsx('mx:0', brand?.className)} />}
                        </span>
                        <span className="font:xs text:strong font:sm@md">{row.name}</span>
                        <motion.span
                            animate={showValues ? { opacity: 1, y: 0 } : { opacity: 0, y: 4 }}
                            className="inline-flex items-baseline gap:2xs gap:xs@md"
                            data-home-value
                            initial={reduceMotion ? false : { opacity: 0, y: 4 }}
                            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}>
                            <span className={clsx('font-weight:560 font:md text:strong font:lg@md', row.isMasterCSS && 'text:yellow')}>{row.valueLabel}</span>
                            {!row.isMasterCSS && <span className="font:xs text:muted">{ratioLabel}</span>}
                        </motion.span>
                    </motion.span>
                </div>
            </div>
        </div>
    )
}
