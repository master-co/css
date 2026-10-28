'use client'

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { useInView } from 'react-intersection-observer'
import { useMediaQuery } from 'usehooks-ts'
import clsx from 'clsx'
import type { HomePageCSSSizeMode, HomePageCSSSizeModeId, HomePageCSSSizeRow } from '~/site/utils/home-page-css-size'
import HomeSegmentedControl from './HomeSegmentedControl'

export interface BenchmarkSizeChartLabels {
  caption: string
  /** The snapshot date, kept on one line after the caption. */
  date: string
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
const axisHeadroom = 1.45

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
    <div className="home-bench-layout" data-visible={inView || undefined} ref={ref}>
      <div className="home-bench-summary">
        <HomeSegmentedControl aria-label={labels.modeSelectorLabel} onValueChange={setActiveModeId} options={modeOptions} value={activeMode.id} />
        <p className="home-annotation home-bench-caption">{labels.caption} <span className="white-space:nowrap">· {labels.date}</span></p>
      </div>
      {/* Remounting per mode replays the bars from the shared start. */}
      <BenchmarkRows brands={brands} key={activeMode.id} mode={activeMode} reduceMotion={reduceMotion} visible={inView} />
    </div>
  )
}

function BenchmarkRows({ brands, mode, reduceMotion, visible }: {
  brands: Record<string, BenchmarkBrand>
  mode: HomePageCSSSizeMode
  reduceMotion: boolean
  visible: boolean
}) {
  const [played, setPlayed] = useState(false)
  const rowsRef = useRef<HTMLDivElement>(null)
  // Measure the plot, excluding the desktop brand column. Mobile readouts sit above their bars.
  const [{ inlineLabels, width }, setSize] = useState({ inlineLabels: true, width: Infinity })
  useEffect(() => {
    const rows = rowsRef.current
    if (!rows) return
    const resize = new ResizeObserver(([entry]) => setSize({
      inlineLabels: parseFloat(getComputedStyle(rows).getPropertyValue('--home-bench-brand-width')) > 0,
      width: entry.contentRect.width
    }))
    resize.observe(rows.querySelector('.home-bench-track') || rows)
    return () => resize.disconnect()
  }, [])
  const narrow = width < 320
  const ticks = width < 640 ? 2 : axisTickTarget
  // Only inline readouts need extra axis space beyond the longest bar.
  const headroom = inlineLabels ? (narrow ? 2.1 : width < 900 ? axisHeadroom : 1.2) : 1.1
  const axis = useMemo(() => createBenchmarkAxis(mode.maxBytes, headroom, ticks), [mode.maxBytes, headroom, ticks])
  const barDuration = Math.max(1.2, chartAnimationDuration - (mode.rows.length - 1) * rowDelayStep - ratioFadeDuration)

  useEffect(() => {
    if (!visible || reduceMotion) return
    // Compute the start positions first so the bars transition away from them.
    rowsRef.current?.getBoundingClientRect()
    setPlayed(true)
  }, [reduceMotion, visible])

  const settled = reduceMotion || played
  return (
    <div className="home-bench-chart" ref={rowsRef}>
      <div aria-hidden="true" className="home-bench-grid">
        <div className="position:relative">
          {axis.ticks.map((tick) => (
            <span className="home-bench-gridline" key={tick.label} style={{ left: `${tick.percent}%` }} />
          ))}
        </div>
      </div>

      <div className="home-bench-rows">
        {mode.rows.map((row, index) => (
          <BenchmarkRow
            axisMaxBytes={axis.maxBytes}
            barDuration={barDuration}
            brand={brands[row.name]}
            delay={index * rowDelayStep}
            key={row.name}
            played={played}
            reduceMotion={reduceMotion}
            row={row}
            settled={settled} />
        ))}
      </div>

      {/* The axis is a ruler: a baseline with four ticks per labelled step, and labels under the major ones. */}
      <div className="home-bench-axis" style={{ '--home-bench-minor': `${100 / ((axis.ticks.length - 1) * 4)}%` } as CSSProperties}>
        <div className="position:relative height:1.25rem width:100%">
          {axis.ticks.map((tick, index) => (
            <span
              className={clsx('position:absolute top:0 white-space:nowrap home-bench-tick', narrow && index > 0 && index < axis.ticks.length - 1 && 'visibility:hidden')}
              key={tick.label}
              style={{ left: `${tick.percent}%`, translate: tick.percent === 0 ? undefined : tick.percent === 100 ? '-100%' : '-50%' }}>
              {tick.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function BenchmarkRow({ axisMaxBytes, barDuration, brand, delay, played, reduceMotion, row, settled }: {
  axisMaxBytes: number
  barDuration: number
  brand?: BenchmarkBrand
  delay: number
  played: boolean
  reduceMotion: boolean
  row: HomePageCSSSizeRow
  settled: boolean
}) {
  const rowPercent = toPercent(row.bytes, axisMaxBytes)
  const startPercent = `${chartAnimationStartPercent}%`
  const transition = {
    transitionDelay: reduceMotion ? '0s' : `${delay}s`,
    transitionDuration: reduceMotion ? '0s' : `${barDuration}s`,
    transitionTimingFunction: chartEasing
  }
  return (
    <div
      className={clsx('home-bench-row', row.isMasterCSS && 'home-bench-row-signal')}
      data-brand={row.name}
      style={{ '--home-bench-pulse-delay': `${-delay * 12}s` } as CSSProperties}>
      <div className="home-bench-brand">
        {brand?.icon && <span aria-hidden="true" className="home-bench-icon">{brand.icon}</span>}
        <span>{row.name}</span>
      </div>
      <div className="home-bench-track">
        <div
          aria-hidden="true"
          className="position:absolute left:0 top:50% min-width:1px translate:0|-50% transition-property:width home-bench-bar"
          style={{ ...transition, width: settled ? `${rowPercent}%` : startPercent }} />
        <span
          className="home-bench-readout"
          style={{ ...transition, '--home-bench-end': settled ? `${rowPercent}%` : `min(${startPercent}, calc(100% - 7rem))` } as CSSProperties}>
          <span className="home-bench-label">
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
                className={clsx('transition-property:opacity,translate home-bench-ratio', settled ? 'opacity:1' : 'opacity:0 translate:0|3px')}
                style={{ transitionDelay: `${reduceMotion ? 0 : delay + barDuration}s`, transitionDuration: `${ratioFadeDuration}s`, transitionTimingFunction: chartEasing }}>
                {`${row.ratio.toFixed(1)}×`}
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

function createBenchmarkAxis(maxBytes: number, headroom: number, tickTarget: number) {
  const maxKilobytes = Math.max(1, maxBytes / 1000)
  const step = getNiceAxisStep(maxKilobytes / tickTarget)
  // Leave room past the longest bar for its value and ratio, which sit beside the bar.
  const axisMaxKilobytes = Math.ceil(maxKilobytes * headroom / step) * step
  const ticks: BenchmarkAxisTick[] = []
  for (let valueKilobytes = 0; valueKilobytes <= axisMaxKilobytes + step / 2; valueKilobytes += step) {
    ticks.push({ label: formatAxisNumber(valueKilobytes), percent: toPercent(valueKilobytes, axisMaxKilobytes) })
  }
  // Only the last tick carries the unit, so narrow axes keep their labels apart.
  ticks[ticks.length - 1].label += ' kB'
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
