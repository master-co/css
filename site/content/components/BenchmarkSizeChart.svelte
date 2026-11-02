<script lang="ts" module>
  import type { HomePageCSSSizeModeId } from '~/site/utils/home-page-css-size'

  export interface BenchmarkSizeChartLabels {
    caption: string
    /** The snapshot date, kept on one line after the caption. */
    date: string
    modeLabels: Record<HomePageCSSSizeModeId, string>
    modeSelectorLabel: string
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
</script>

<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HomePageCSSSizeMode } from '~/site/utils/home-page-css-size'
  import HomeSegmentedControl from './HomeSegmentedControl.svelte'
  import { createBenchmarkAxis, formatKilobytes, mountBenchmarkCanvas, toPercent, type BenchmarkCanvas } from './benchmark-size-canvas'

  interface Props {
    labels: BenchmarkSizeChartLabels
    modes: HomePageCSSSizeMode[]
    /**
     * Brand icons render on the server and arrive as static slots named `icon<index>`,
     * by each brand's row index in the first mode.
     */
    [icon: `icon${number}`]: Snippet | undefined
  }

  /**
   * Page CSS sizes as bars on one canvas that count down from a shared start once the chart scrolls into view.
   * The server renders the rows, values and DOM bars at the measured sizes, so the chart reads true without scripts
   * and before hydration; the canvas takes over once it has painted.
   */
  let { labels, modes, ...icons }: Props = $props()

  // svelte-ignore state_referenced_locally
  let activeModeId = $state(modes[0].id)
  let switched = $state(false)
  const activeMode = $derived(modes.find((mode) => mode.id === activeModeId) || modes[0])
  const modeOptions = $derived(modes.map((mode) => ({ label: labels.modeLabels[mode.id], value: mode.id })))
  const iconOf = (name: string) => icons[`icon${modes[0].rows.findIndex((row) => row.name === name)}`]
  let chart = $state<HTMLDivElement>()
  let canvas = $state<HTMLCanvasElement>()
  let painter: BenchmarkCanvas | undefined
  let plot = $state(plotShape(true, Infinity))

  $effect(() => {
    const track = chart?.querySelector('.home-bench-track')
    if (!chart || !track) return
    const element = chart
    const resize = new ResizeObserver(([entry]) => {
      const next = plotShape(parseFloat(getComputedStyle(element).getPropertyValue('--home-bench-brand-width')) > 0, entry.contentRect.width)
      if (plot.inline !== next.inline || plot.narrow !== next.narrow || plot.headroom !== next.headroom) plot = next
    })
    resize.observe(track)
    return () => resize.disconnect()
  })

  const axis = $derived(createBenchmarkAxis(activeMode.maxBytes, plot.headroom))

  $effect(() => {
    if (!chart || !canvas) return
    const mounted = mountBenchmarkCanvas(chart, canvas)
    painter = mounted
    return () => {
      mounted?.dispose()
      painter = undefined
    }
  })

  // Before the browser paints the new rows, the painter sets each one where the last frame left it.
  $effect(() => { painter?.update(activeMode, axis) })
</script>

<div class="home-bench-layout">
  <div class="home-bench-summary">
    <HomeSegmentedControl
      aria-label={labels.modeSelectorLabel}
      onValueChange={(value) => {
        switched = true
        activeModeId = value
      }}
      options={modeOptions}
      value={activeMode.id} />
    <p class="home-annotation home-bench-caption">{labels.caption} <span class="whitespace-nowrap">· {labels.date}</span></p>
  </div>
  <div bind:this={chart} class="home-bench-chart" style:--home-bench-minor={`${100 / ((axis.ticks.length - 1) * 4)}%`}>
    <canvas bind:this={canvas} aria-hidden="true" class="home-bench-canvas"></canvas>
    <!-- Gridlines, bars and the ruler's marks below stand in until the canvas paints, and in print. -->
    <div aria-hidden="true" class="home-bench-grid">
      <div class="relative">
        {#each axis.ticks as tick (tick.label)}
          <span class="home-bench-gridline" style:left={`${tick.percent}%`}></span>
        {/each}
      </div>
    </div>
    <ol class="home-bench-rows">
      {#each activeMode.rows as row (row.name)}
        {@const percent = `${toPercent(row.bytes, axis.maxBytes)}%`}
        {@const size = formatKilobytes(row.bytes)}
        {@const icon = iconOf(row.name)}
        <!-- The painter counts the visible value and clears `data-settled` while a row moves. -->
        <li class={['home-bench-row', row.isMasterCSS && 'home-bench-row-signal']} data-brand={row.name} data-settled="">
          <div class="home-bench-brand">
            {#if icon}<span aria-hidden="true" class="home-bench-icon">{@render icon()}</span>{/if}
            <span>{row.name}</span>
          </div>
          <div class="home-bench-track">
            <div aria-hidden="true" class="home-bench-bar" style:width={percent}></div>
            <span class="home-bench-readout" style:--home-bench-end={percent}>
              <span class="home-bench-label">
                <!-- Screen readers get the measured size, never a number mid-count. -->
                <span aria-hidden="true" class="home-bench-value">{size}</span>
                <span class="sr-only">{size}</span>
                {#if !row.isMasterCSS}<span class="home-bench-ratio">{`${row.ratio.toFixed(1)}×`}</span>{/if}
              </span>
            </span>
          </div>
        </li>
      {/each}
    </ol>
    <!-- The axis is a ruler: a baseline with four ticks per labelled step, and labels under the major ones. -->
    {#key activeMode.id}
      <div class="home-bench-axis" data-switched={switched || undefined}>
        <div class="relative (height:1.25rem) w-full">
          {#each axis.ticks as tick, index (tick.label)}
            <span
              class={['absolute top(0) whitespace-nowrap home-bench-tick', plot.narrow && index > 0 && index < axis.ticks.length - 1 && 'invisible']}
              style:left={`${tick.percent}%`}
              style:translate={tick.percent === 0 ? undefined : tick.percent === 100 ? '-100%' : '-50%'}>
              {tick.label}
            </span>
          {/each}
        </div>
      </div>
    {/key}
  </div>
</div>
