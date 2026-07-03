import snapshot from '~/site/../benchmarks/browser-css-cost/snapshot.json'

type CacheMode = 'cold-cache' | 'warm-cache'
type TraceMetricId = 'styleRecalculationMs' | 'layoutMs' | 'paintMs'

type SummaryStats = {
    median: number
}

type BrowserCostResult = {
    timing: Record<TraceMetricId, SummaryStats>
    dom: {
        nodeCount: SummaryStats
    }
    css: {
        brotliBytes: number
    }
    structure: {
        declarations: number
        styleRules: number
    }
}

type BrowserCostGroup = {
    id: string
    label: string
    results: Record<CacheMode, BrowserCostResult>
}

export interface HomeCSSVolumeItem {
    id: string
    label: string
    brotliBytes: number
    brotliLabel: string
    declarations: number
    declarationsLabel: string
    rulesLabel: string
    percent: number
}

export interface HomeDOMScalingItem {
    id: string
    label: string
    nodes: number
    nodesLabel: string
    styleRecalculationMs: number
    layoutMs: number
    paintMs: number
    styleLabel: string
    layoutLabel: string
    paintLabel: string
    percent: number
}

const primaryCacheMode = 'warm-cache' satisfies CacheMode
const cssVolume = snapshot.cssVolume as BrowserCostGroup[]
const domScaling = snapshot.domScaling as BrowserCostGroup[]

function getWarmResult(group: BrowserCostGroup) {
    return group.results[primaryCacheMode]
}

function formatNumber(value: number, maximumFractionDigits = 0) {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits }).format(value)
}

function formatBytes(bytes: number) {
    return `${formatNumber(bytes / 1000, 1)} kB`
}

function formatMs(value: number) {
    return `${formatNumber(value, value >= 10 ? 1 : 2)} ms`
}

function percent(value: number, max: number) {
    if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) return 0
    return Math.max(0, Math.min(100, value / max * 100))
}

export function getHomeBrowserCSSCost() {
    const browser = (snapshot as { browser?: { name: string; version: string } }).browser
    const largestCSS = getWarmResult(cssVolume[cssVolume.length - 1])
    const largestDOM = getWarmResult(domScaling[domScaling.length - 1])
    const maxCSSBytes = Math.max(...cssVolume.map((group) => getWarmResult(group).css.brotliBytes))
    const maxDOMNodes = Math.max(...domScaling.map((group) => getWarmResult(group).dom.nodeCount.median))

    return {
        browserLabel: browser ? `${browser.name} ${browser.version}` : 'Chromium',
        cacheModeLabel: 'Warm-cache median',
        cssLevelCount: cssVolume.length,
        largestCSSLabel: formatBytes(largestCSS.css.brotliBytes),
        largestDeclarationsLabel: formatNumber(largestCSS.structure.declarations),
        largestDOMLabel: formatNumber(largestDOM.dom.nodeCount.median),
        largestDOMStyleLabel: formatMs(largestDOM.timing.styleRecalculationMs.median),
        largestDOMLayoutLabel: formatMs(largestDOM.timing.layoutMs.median),
        largestDOMPaintLabel: formatMs(largestDOM.timing.paintMs.median),
        cssVolume: cssVolume.map((group): HomeCSSVolumeItem => {
            const result = getWarmResult(group)
            return {
                id: group.id,
                label: group.label,
                brotliBytes: result.css.brotliBytes,
                brotliLabel: formatBytes(result.css.brotliBytes),
                declarations: result.structure.declarations,
                declarationsLabel: formatNumber(result.structure.declarations),
                rulesLabel: formatNumber(result.structure.styleRules),
                percent: percent(result.css.brotliBytes, maxCSSBytes)
            }
        }),
        domScaling: domScaling.map((group): HomeDOMScalingItem => {
            const result = getWarmResult(group)
            const nodes = result.dom.nodeCount.median
            const styleRecalculationMs = result.timing.styleRecalculationMs.median
            const layoutMs = result.timing.layoutMs.median
            const paintMs = result.timing.paintMs.median
            return {
                id: group.id,
                label: group.label,
                nodes,
                nodesLabel: formatNumber(nodes),
                styleRecalculationMs,
                layoutMs,
                paintMs,
                styleLabel: formatMs(styleRecalculationMs),
                layoutLabel: formatMs(layoutMs),
                paintLabel: formatMs(paintMs),
                percent: percent(nodes, maxDOMNodes)
            }
        })
    }
}
