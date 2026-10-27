'use client'

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useInView } from 'react-intersection-observer'
import { useMediaQuery } from 'usehooks-ts'
import clsx from 'clsx'
import type { HomePageCSSSizeMode, HomePageCSSSizeModeId, HomePageCSSSizeRow } from '~/site/utils/home-page-css-size'
import HomeSegmentedControl from './HomeSegmentedControl'

export interface BenchmarkSizeChartLabels {
  caption: string
  largerSuffix: string
  modeLabels: Record<HomePageCSSSizeModeId, string>
  modeSelectorLabel: string
}

export interface BenchmarkBrand {
  icon?: ReactNode
}

const chartAnimationDuration = 3
const chartAnimationStartPercent = 90
const chartEasing = 'cubic-bezier(.22,1,.36,1)'
const ratioFadeDuration = 0.24
const rowDelayStep = 0.085
const axisTickTarget = 4
const chartGridStyle = { gridTemplateColumns: 'minmax(5.25rem, 6.5rem) minmax(0, 1fr)' }

/** Page CSS sizes as bars that grow from a shared start once the chart scrolls into view. */
export default function BenchmarkSizeChart({ brands, labels, modes }: {
  brands: Record<string, BenchmarkBrand>
  labels: BenchmarkSizeChartLabels
  modes: HomePageCSSSizeMode[]
}) {
  const [activeModeId, setActiveModeId] = useState(modes[0].id)
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.34 })
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)', { initializeWithValue: false })
  const activeMode = modes.find((mode) => mode.id === activeModeId) || modes[0]
  const modeOptions = useMemo(() => modes.map((mode) => ({ label: labels.modeLabels[mode.id], value: mode.id })), [labels.modeLabels, modes])
  return (
    <div className="position:relative" ref={ref}>
      <div className="display:flex flex-direction:column gap-lg">
        <div className="display:flex flex-wrap:wrap align-items:center justify-content:space-between gap-sm">
          <HomeSegmentedControl aria-label={labels.modeSelectorLabel} onValueChange={setActiveModeId} options={modeOptions} value={activeMode.id} />
          <span className="home-annotation">{labels.caption}</span>
        </div>
        {/* Remounting per mode replays the bars from the shared start. */}
        <BenchmarkRows brands={brands} key={activeMode.id} labels={labels} mode={activeMode} reduceMotion={reduceMotion} visible={inView} />
      </div>
    </div>
  )
}

function BenchmarkRows({ brands, labels, mode, reduceMotion, visible }: {
  brands: Record<string, BenchmarkBrand>
  labels: BenchmarkSizeChartLabels
  mode: HomePageCSSSizeMode
  reduceMotion: boolean
  visible: boolean
}) {
  const [played, setPlayed] = useState(false)
  const rowsRef = useRef<HTMLDivElement>(null)
  const axis = useMemo(() => createBenchmarkAxis(mode.maxBytes), [mode.maxBytes])
  const barDuration = Math.max(1.2, chartAnimationDuration - (mode.rows.length - 1) * rowDelayStep - ratioFadeDuration)

  useEffect(() => {
    if (!visible || reduceMotion) return
    // Compute the start positions first so the bars transition away from them.
    rowsRef.current?.getBoundingClientRect()
    setPlayed(true)
  }, [reduceMotion, visible])

  const settled = reduceMotion || played
  return (
    <div className="position:relative" ref={rowsRef}>
      <div aria-hidden="true" className="position:absolute bottom:1.5rem left:0 right:0 top:0 display:grid gap-sm pointer-events:none" style={chartGridStyle}>
        <span />
        <div className="position:relative">
          {axis.ticks.map((tick) => (
            <span className="home-bench-gridline" key={tick.label} style={{ left: `${tick.percent}%` }} />
          ))}
        </div>
      </div>

      <div className="position:relative z-index:1 display:grid gap-2xs">
        {mode.rows.map((row, index) => (
          <BenchmarkRow
            axisMaxBytes={axis.maxBytes}
            barDuration={barDuration}
            brand={brands[row.name]}
            delay={index * rowDelayStep}
            key={row.name}
            labels={labels}
            played={played}
            reduceMotion={reduceMotion}
            row={row}
            settled={settled} />
        ))}
      </div>

      <div className="display:grid gap-sm mt-xs" style={chartGridStyle}>
        <span />
        <div className="position:relative height:1.25rem width:100%">
          {axis.ticks.map((tick, index) => {
            const compactTick = index === 0 || index === Math.floor((axis.ticks.length - 1) / 2) || index === axis.ticks.length - 1
            return (
              <span
                className={clsx('position:absolute top:0 white-space:nowrap home-bench-tick', !compactTick && 'display:none@media((width<64rem))')}
                key={tick.label}
                style={{ left: `${tick.percent}%`, translate: tick.percent === 0 ? undefined : tick.percent === 100 ? '-100%' : '-50%' }}>
                {tick.label}
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function BenchmarkRow({ axisMaxBytes, barDuration, brand, delay, labels, played, reduceMotion, row, settled }: {
  axisMaxBytes: number
  barDuration: number
  brand?: BenchmarkBrand
  delay: number
  labels: BenchmarkSizeChartLabels
  played: boolean
  reduceMotion: boolean
  row: HomePageCSSSizeRow
  settled: boolean
}) {
  const rowPercent = toPercent(row.bytes, axisMaxBytes)
  const startPercent = `${chartAnimationStartPercent}%`
  const transition = {
    transitionDelay: `${delay}s`,
    transitionDuration: reduceMotion ? '0s' : `${barDuration}s`,
    transitionTimingFunction: chartEasing
  }
  return (
    <div className={clsx('display:grid align-items:center gap-sm min-height:2.75rem home-bench-row', row.isMasterCSS && 'home-bench-row-signal')} style={chartGridStyle}>
      <span className="display:block overflow:hidden min-width:0 text-overflow:ellipsis white-space:nowrap home-bench-name">{row.name}</span>
      <div className="position:relative height:2.75rem min-width:0">
        <div
          className="position:absolute left:0 top:50% min-width:1px translate:0|-50% transition-property:width home-bench-bar"
          style={{ ...transition, width: settled ? `${rowPercent}%` : startPercent }} />
        <span
          className="position:absolute top:50% z-index:1 display:inline-flex align-items:center gap-2xs white-space:nowrap translate:0|-50% transition-property:left pointer-events:none gap-sm@md"
          style={{ ...transition, left: settled ? `${rowPercent}%` : `min(${startPercent}, calc(100% - 5.25rem))` }}>
          {brand?.icon && <span className="display:inline-flex flex:none ml-xs ml-sm@md home-bench-icon">{brand.icon}</span>}
          <span className="display:inline-flex align-items:baseline gap-2xs gap-xs@md">
            <CountdownKilobytes
              active={played}
              barDuration={barDuration}
              className="home-bench-value"
              delay={delay}
              fromBytes={axisMaxBytes * chartAnimationStartPercent / 100}
              reduceMotion={reduceMotion}
              toBytes={row.bytes} />
            {!row.isMasterCSS && (
              <span
                className={clsx('transition-property:opacity,translate display:none@media((width<64rem)) home-bench-ratio', settled ? 'opacity:1' : 'opacity:0 translate:0|3px')}
                style={{ transitionDelay: `${reduceMotion ? 0 : delay + barDuration}s`, transitionDuration: `${ratioFadeDuration}s`, transitionTimingFunction: chartEasing }}>
                {`${row.ratio.toFixed(1)}${labels.largerSuffix}`}
              </span>
            )}
          </span>
        </span>
      </div>
    </div>
  )
}

function CountdownKilobytes({ active, barDuration, className, delay, fromBytes, reduceMotion, toBytes }: {
  active: boolean
  barDuration: number
  className?: string
  delay: number
  fromBytes: number
  reduceMotion: boolean
  toBytes: number
}) {
  const [displayBytes, setDisplayBytes] = useState(fromBytes)

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
        startedAt ||= timestamp
        const progress = Math.min(1, (timestamp - startedAt) / (barDuration * 1000))
        setDisplayBytes(fromBytes + (toBytes - fromBytes) * (1 - (1 - progress) ** 3))
        if (progress < 1) animationFrame = window.requestAnimationFrame(step)
      }
      animationFrame = window.requestAnimationFrame(step)
    }, delay * 1000)
    return () => {
      window.clearTimeout(timeout)
      window.cancelAnimationFrame(animationFrame)
    }
  }, [active, barDuration, delay, fromBytes, reduceMotion, toBytes])

  return <span className={className}>{formatKilobytes(displayBytes)}</span>
}

interface BenchmarkAxisTick {
  label: string
  percent: number
}

function createBenchmarkAxis(maxBytes: number) {
  const maxKilobytes = Math.max(1, maxBytes / 1000)
  const step = getNiceAxisStep(maxKilobytes / axisTickTarget)
  const axisMaxKilobytes = (Math.ceil(maxKilobytes / step) + 1) * step
  const ticks: BenchmarkAxisTick[] = []
  for (let valueKilobytes = 0; valueKilobytes <= axisMaxKilobytes + step / 2; valueKilobytes += step) {
    ticks.push({ label: `${formatAxisNumber(valueKilobytes)} kB`, percent: toPercent(valueKilobytes, axisMaxKilobytes) })
  }
  return { maxBytes: axisMaxKilobytes * 1000, ticks }
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
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(bytes / 1000)} kB`
}

function toPercent(value: number, max: number) {
  if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) return 0
  return Math.max(0, Math.min(100, value / max * 100))
}
