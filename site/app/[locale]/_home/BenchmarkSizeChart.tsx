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
const axisTickTarget = 4
const chartGridStyle = { gridTemplateColumns: 'minmax(5.25rem, 6.5rem) minmax(0, 1fr)' }

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
    const chartRef = useRef<HTMLDivElement>(null)
    const reduceMotion = useReducedMotion()
    const inView = useInView(chartRef, { once: true, amount: 0.34 })
    const activeMode = useMemo(
        () => pageCSSSize.modes.find((mode) => mode.id === activeModeId) || pageCSSSize.modes[0],
        [activeModeId, pageCSSSize.modes]
    )
    const axis = useMemo(() => createBenchmarkAxis(activeMode.maxBytes), [activeMode.maxBytes])

    return (
        <div ref={chartRef} className="rel py:md">
            <div className="flex flex-col gap:lg">
                <div className="flex w:fit p:3px rounded surface:muted">
                    {pageCSSSize.modes.map((mode) => {
                        const active = mode.id === activeMode.id
                        return (
                            <button
                                aria-pressed={active}
                                className={clsx(
                                    'h:8x px:sm rounded outline-offset:2xs font:xs transition:background-color|fast|smooth,color|fast|smooth outline:2px|solid|yellow:focus-visible',
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

                <div className="rel" key={activeMode.id}>
                    <div
                        aria-hidden="true"
                        className="abs inset:0|0|auto|0 pointer-events:none"
                        style={{ bottom: '1.5rem' }}>
                        <div className="grid gap:sm h:full" style={chartGridStyle}>
                            <span />
                            <div className="rel h:full">
                                <div className="abs bottom:0 left:0 top:0 w:38% w:60%@md w:72%@lg">
                                    {axis.ticks.map((tick) => (
                                        <span
                                            className="abs bottom:0 top:0 w:1px bg:line-muted opacity:.42"
                                            data-home-axis-guide
                                            key={tick.label}
                                            style={{ left: `${tick.percent}%` }} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rel z:1 grid gap:2xs">
                        {activeMode.rows.map((row, index) => (
                            <PageCSSSizeRow
                                axisMaxBytes={axis.maxBytes}
                                inView={inView}
                                index={index}
                                key={row.name}
                                labels={labels}
                                reduceMotion={Boolean(reduceMotion)}
                                row={row} />
                        ))}
                    </div>

                    <div className="grid gap:sm mt:xs" style={chartGridStyle}>
                        <span />
                        <div className="rel h:5x w:38% w:60%@md w:72%@lg">
                            {axis.ticks.map((tick, index) => {
                                const compactTick = index === 0 || index === Math.floor((axis.ticks.length - 1) / 2) || index === axis.ticks.length - 1
                                return (
                                    <span
                                        className={clsx('abs top:0 font:2xs white-space:nowrap text:muted', !compactTick && 'hidden@<md')}
                                        data-home-axis-label
                                        key={tick.label}
                                        style={{
                                            left: `${tick.percent}%`,
                                            transform: tick.percent === 0 ? undefined : tick.percent === 100 ? 'translateX(-100%)' : 'translateX(-50%)'
                                        }}>
                                        {tick.label}
                                    </span>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function PageCSSSizeRow({
    axisMaxBytes,
    inView,
    index,
    labels,
    reduceMotion,
    row
}: {
    axisMaxBytes: number
    inView: boolean
    index: number
    labels: BenchmarkSizeChartLabels
    reduceMotion: boolean
    row: HomePageCSSSizeRow
}) {
    const brand = Object.values(brands).find((eachBrand) => eachBrand.name === row.name)
    const BrandIcon = brand?.src
    const colorClassName = row.isMasterCSS ? 'bg:yellow' : brandColorClasses[brand?.color || ''] || 'bg:blue'
    const rowPercent = toPercent(row.bytes, axisMaxBytes)
    const markerPercent = Math.max(0, Math.min(100, rowPercent))
    const ratioLabel = `${row.ratio.toFixed(1)}${labels.largerSuffix}`

    return (
        <div className="py:0">
            <div className="grid items-center gap:sm min-h:11x" style={chartGridStyle}>
                <div className="min-w:0">
                    <span className="block overflow:hidden font:sm text-ellipsis white-space:nowrap text:strong" data-home-row-label>{row.name}</span>
                </div>

                <div className="rel h:11x min-w:0">
                    <div className="rel h:11x w:38% w:60%@md w:72%@lg">
                    <motion.div
                        animate={{ width: reduceMotion || inView ? `${rowPercent}%` : '100%' }}
                        className={clsx('abs inset:50%|auto|auto|0 h:12px min-w:1px r:xs transform:translateY(-50%)', colorClassName)}
                        data-home-bar-fill
                        initial={reduceMotion ? false : { width: '100%' }}
                        transition={{ delay: index * rowDelayStep, duration: barDuration, ease: [0.22, 1, 0.36, 1] }} />
                    <motion.span
                        animate={{ left: reduceMotion || inView ? `${markerPercent}%` : '100%' }}
                        className="abs top:50% z:1 inline-flex items-center gap:xs white-space:nowrap pointer-events:none gap:sm@md"
                        data-home-marker
                        initial={reduceMotion ? false : { left: '100%' }}
                        style={{ transform: 'translate(0, -50%)' }}
                        transition={{ delay: index * rowDelayStep, duration: barDuration, ease: [0.22, 1, 0.36, 1] }}>
                        {BrandIcon && <BrandIcon width={28} height={28} className={clsx('flex:0|0|auto mx:0', brand?.className)} />}
                        <span className="inline-flex items-baseline gap:2xs gap:xs@md" data-home-value>
                            <CountdownKilobytes
                                active={inView}
                                className={clsx('tabular-nums font-weight:560 font:lg text:strong font:xl@md', row.isMasterCSS && 'text:yellow')}
                                delay={index * rowDelayStep}
                                fromBytes={axisMaxBytes}
                                reduceMotion={reduceMotion}
                                toBytes={row.bytes} />
                            {!row.isMasterCSS && (
                                <RatioLabel
                                    active={inView}
                                    delay={index * rowDelayStep + barDuration}
                                    reduceMotion={reduceMotion}>
                                    {ratioLabel}
                                </RatioLabel>
                            )}
                        </span>
                    </motion.span>
                    </div>
                </div>
            </div>
        </div>
    )
}

function CountdownKilobytes({
    active,
    className,
    delay,
    fromBytes,
    reduceMotion,
    toBytes
}: {
    active: boolean
    className?: string
    delay: number
    fromBytes: number
    reduceMotion: boolean
    toBytes: number
}) {
    const [displayBytes, setDisplayBytes] = useState(reduceMotion ? toBytes : fromBytes)

    useEffect(() => {
        if (reduceMotion) {
            setDisplayBytes(toBytes)
            return
        }

        setDisplayBytes(fromBytes)
        if (!active) return

        let animationFrame = 0
        let startedAt = 0
        const timeout = window.setTimeout(() => {
            const step = (timestamp: number) => {
                if (!startedAt) startedAt = timestamp
                const progress = Math.min(1, (timestamp - startedAt) / (barDuration * 1000))
                const easedProgress = 1 - (1 - progress) ** 3
                setDisplayBytes(fromBytes + (toBytes - fromBytes) * easedProgress)
                if (progress < 1) {
                    animationFrame = window.requestAnimationFrame(step)
                } else {
                    setDisplayBytes(toBytes)
                }
            }
            animationFrame = window.requestAnimationFrame(step)
        }, delay * 1000)

        return () => {
            window.clearTimeout(timeout)
            if (animationFrame) window.cancelAnimationFrame(animationFrame)
        }
    }, [active, delay, fromBytes, reduceMotion, toBytes])

    return <span className={className}>{formatKilobytes(displayBytes)}</span>
}

function RatioLabel({
    active,
    children,
    delay,
    reduceMotion
}: {
    active: boolean
    children: string
    delay: number
    reduceMotion: boolean
}) {
    return (
        <motion.span
            animate={reduceMotion || active ? { opacity: 1, y: 0 } : { opacity: 0, y: 3 }}
            className="font:xs text:muted"
            data-home-ratio-label
            initial={reduceMotion ? false : { opacity: 0, y: 3 }}
            transition={{ delay: reduceMotion ? 0 : delay, duration: 0.24, ease: [0.22, 1, 0.36, 1] }}>
            {children}
        </motion.span>
    )
}

type BenchmarkAxisTick = {
    label: string
    percent: number
    valueKilobytes: number
}

function createBenchmarkAxis(maxBytes: number) {
    const maxKilobytes = Math.max(1, maxBytes / 1000)
    const step = getNiceAxisStep(maxKilobytes / axisTickTarget)
    const axisMaxKilobytes = Math.ceil(maxKilobytes / step) * step
    const ticks: BenchmarkAxisTick[] = []

    for (let valueKilobytes = 0; valueKilobytes <= axisMaxKilobytes + step / 2; valueKilobytes += step) {
        ticks.push({
            label: `${formatAxisNumber(valueKilobytes)}kB`,
            percent: toPercent(valueKilobytes, axisMaxKilobytes),
            valueKilobytes
        })
    }

    return {
        maxBytes: axisMaxKilobytes * 1000,
        ticks
    }
}

function getNiceAxisStep(targetKilobytes: number) {
    const magnitude = 10 ** Math.floor(Math.log10(targetKilobytes))
    const normalized = targetKilobytes / magnitude

    if (normalized <= 1) return magnitude
    if (normalized <= 2) return 2 * magnitude
    if (normalized <= 5) return 5 * magnitude
    return 10 * magnitude
}

function formatAxisNumber(value: number) {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: value >= 10 ? 0 : 1 }).format(value)
}

function formatKilobytes(bytes: number) {
    const kilobytes = bytes / 1000
    return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(kilobytes)} kB`
}

function toPercent(value: number, max: number) {
    if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) return 0
    return Math.max(0, Math.min(100, value / max * 100))
}
