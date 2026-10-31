'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import clsx from 'clsx'
import type { HomePageCSSSizeMode, HomePageCSSSizeModeId } from '~/site/utils/home-page-css-size'
import HomeSegmentedControl from './HomeSegmentedControl'
import { createBenchmarkAxis, formatKilobytes, mountBenchmarkCanvas, toPercent, type BenchmarkCanvas } from './benchmark-size-canvas'

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

interface PlotShape {
  /** Desktop readouts ride beside their bars; phone readouts sit above them. */
  inline: boolean
  /** Only the axis's ends are labelled on a very narrow plot. */
  narrow: boolean
  /** Axis room past the longest bar: inline readouts need more, the narrower the plot. */
  headroom: number
}

function plotShape(inline: boolean, width: number): PlotShape {
  return { inline, narrow: width < 320, headroom: !inline ? 1.1 : width < 320 ? 2.1 : width < 900 ? 1.45 : 1.2 }
}

/**
 * Page CSS sizes as bars on one canvas that count down from a shared start once the chart scrolls into view.
 * The server renders the rows, values and DOM bars at the measured sizes, so the chart reads true without scripts
 * and before hydration; the canvas takes over once it has painted.
 */
export default function BenchmarkSizeChart({ brands, labels, modes }: {
  brands: Record<string, BenchmarkBrand>
  labels: BenchmarkSizeChartLabels
  modes: HomePageCSSSizeMode[]
}) {
  const [activeModeId, setActiveModeId] = useState(modes[0].id)
  const [switched, setSwitched] = useState(false)
  const activeMode = modes.find((mode) => mode.id === activeModeId) || modes[0]
  const modeOptions = useMemo(() => modes.map((mode) => ({ label: labels.modeLabels[mode.id], value: mode.id })), [labels.modeLabels, modes])
  const chartRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const painterRef = useRef<BenchmarkCanvas | undefined>(undefined)
  const [plot, setPlot] = useState(() => plotShape(true, Infinity))

  useEffect(() => {
    const chart = chartRef.current
    const track = chart?.querySelector('.home-bench-track')
    if (!chart || !track) return
    const resize = new ResizeObserver(([entry]) => {
      const next = plotShape(parseFloat(getComputedStyle(chart).getPropertyValue('--home-bench-brand-width')) > 0, entry.contentRect.width)
      setPlot((current) => current.inline === next.inline && current.narrow === next.narrow && current.headroom === next.headroom ? current : next)
    })
    resize.observe(track)
    return () => resize.disconnect()
  }, [])

  const axis = useMemo(() => createBenchmarkAxis(activeMode.maxBytes, plot.headroom), [activeMode.maxBytes, plot.headroom])

  useLayoutEffect(() => {
    const painter = mountBenchmarkCanvas(chartRef.current!, canvasRef.current!)
    painterRef.current = painter
    return () => {
      painter?.dispose()
      painterRef.current = undefined
    }
  }, [])

  // Before the browser paints the new rows, the painter sets each one where the last frame left it.
  useLayoutEffect(() => { painterRef.current?.update(activeMode, axis) }, [activeMode, axis])

  return (
    <div className="home-bench-layout">
      <div className="home-bench-summary">
        <HomeSegmentedControl
          aria-label={labels.modeSelectorLabel}
          onValueChange={(value) => {
            setSwitched(true)
            setActiveModeId(value)
          }}
          options={modeOptions}
          value={activeMode.id} />
        <p className="home-annotation home-bench-caption">{labels.caption} <span className="(white-space:nowrap)">· {labels.date}</span></p>
      </div>
      <div className="home-bench-chart" ref={chartRef} style={{ '--home-bench-minor': `${100 / ((axis.ticks.length - 1) * 4)}%` } as CSSProperties}>
        <canvas aria-hidden="true" className="home-bench-canvas" ref={canvasRef} />
        {/* Gridlines, bars and the ruler's marks below stand in until the canvas paints, and in print. */}
        <div aria-hidden="true" className="home-bench-grid">
          <div className="relative">
            {axis.ticks.map((tick) => (
              <span className="home-bench-gridline" key={tick.label} style={{ left: `${tick.percent}%` }} />
            ))}
          </div>
        </div>
        <ol className="home-bench-rows">
          {activeMode.rows.map((row) => {
            const percent = `${toPercent(row.bytes, axis.maxBytes)}%`
            const size = formatKilobytes(row.bytes)
            return (
              // The painter counts the visible value and clears `data-settled` while a row moves.
              <li className={clsx('home-bench-row', row.isMasterCSS && 'home-bench-row-signal')} data-brand={row.name} data-settled="" key={row.name}>
                <div className="home-bench-brand">
                  {brands[row.name]?.icon && <span aria-hidden="true" className="home-bench-icon">{brands[row.name].icon}</span>}
                  <span>{row.name}</span>
                </div>
                <div className="home-bench-track">
                  <div aria-hidden="true" className="home-bench-bar" style={{ width: percent }} />
                  <span className="home-bench-readout" style={{ '--home-bench-end': percent } as CSSProperties}>
                    <span className="home-bench-label">
                      {/* Screen readers get the measured size, never a number mid-count. */}
                      <span aria-hidden="true" className="home-bench-value">{size}</span>
                      <span className="sr-only">{size}</span>
                      {!row.isMasterCSS && <span className="home-bench-ratio">{`${row.ratio.toFixed(1)}×`}</span>}
                    </span>
                  </span>
                </div>
              </li>
            )
          })}
        </ol>
        {/* The axis is a ruler: a baseline with four ticks per labelled step, and labels under the major ones. */}
        <div className="home-bench-axis" data-switched={switched || undefined} key={activeMode.id}>
          <div className="relative (height:1.25rem) (width:100%)">
            {axis.ticks.map((tick, index) => (
              <span
                className={clsx('absolute (top:0) (white-space:nowrap) home-bench-tick', plot.narrow && index > 0 && index < axis.ticks.length - 1 && 'invisible')}
                key={tick.label}
                style={{ left: `${tick.percent}%`, translate: tick.percent === 0 ? undefined : tick.percent === 100 ? '-100%' : '-50%' }}>
                {tick.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
