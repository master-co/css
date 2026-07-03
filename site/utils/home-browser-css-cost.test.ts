import assert from 'node:assert/strict'
import { test } from 'node:test'
import snapshot from '../../benchmarks/browser-css-cost/snapshot.json'
import { getHomeBrowserCSSCost } from './home-browser-css-cost.js'

type TraceMetricId = 'layoutMs' | 'paintMs' | 'styleRecalculationMs'

interface BrowserCostResult {
    timing: Record<TraceMetricId, { median: number }>
    dom: {
        nodeCount: { median: number }
    }
    css: {
        brotliBytes: number
    }
    structure: {
        declarations: number
        styleRules: number
    }
}

interface BrowserCostGroup {
    id: string
    label: string
    results: {
        'warm-cache': BrowserCostResult
    }
}

const browserCSSCostSnapshot = snapshot as {
    browser?: {
        name: string
        version: string
    }
    cssVolume: BrowserCostGroup[]
    domScaling: BrowserCostGroup[]
}

test('homepage CSS volume data is derived from the committed browser cost snapshot', () => {
    const benchmark = getHomeBrowserCSSCost()
    const cssVolume = browserCSSCostSnapshot.cssVolume

    assert.equal(benchmark.cssLevelCount, cssVolume.length)
    assert.deepEqual(benchmark.cssVolume.map(({ id, label }) => ({ id, label })), cssVolume.map(({ id, label }) => ({ id, label })))
    assert.equal(Math.max(...benchmark.cssVolume.map(({ percent }) => percent)), 100)

    for (const [index, item] of benchmark.cssVolume.entries()) {
        const result = cssVolume[index].results['warm-cache']
        assert.equal(item.brotliBytes, result.css.brotliBytes)
        assert.equal(item.declarations, result.structure.declarations)
        assert.ok(item.brotliLabel.endsWith(' kB'))
        assert.ok(item.declarationsLabel)
        assert.ok(item.rulesLabel)
        assert.ok(item.percent >= 0 && item.percent <= 100)
    }
})

test('homepage DOM scaling metrics use warm-cache medians from the snapshot', () => {
    const benchmark = getHomeBrowserCSSCost()
    const domScaling = browserCSSCostSnapshot.domScaling
    const largestDOM = benchmark.domScaling[benchmark.domScaling.length - 1]

    assert.deepEqual(benchmark.domScaling.map(({ id, label }) => ({ id, label })), domScaling.map(({ id, label }) => ({ id, label })))
    assert.equal(Math.max(...benchmark.domScaling.map(({ percent }) => percent)), 100)
    assert.equal(benchmark.largestDOMStyleLabel, largestDOM.styleLabel)
    assert.equal(benchmark.largestDOMLayoutLabel, largestDOM.layoutLabel)
    assert.equal(benchmark.largestDOMPaintLabel, largestDOM.paintLabel)

    for (const [index, item] of benchmark.domScaling.entries()) {
        const result = domScaling[index].results['warm-cache']
        assert.equal(item.nodes, result.dom.nodeCount.median)
        assert.equal(item.styleRecalculationMs, result.timing.styleRecalculationMs.median)
        assert.equal(item.layoutMs, result.timing.layoutMs.median)
        assert.equal(item.paintMs, result.timing.paintMs.median)
        assert.ok(item.nodesLabel)
        assert.ok(item.styleLabel.endsWith(' ms'))
        assert.ok(item.layoutLabel.endsWith(' ms'))
        assert.ok(item.paintLabel.endsWith(' ms'))
        assert.ok(item.percent >= 0 && item.percent <= 100)
    }
})

test('homepage benchmark labels keep the snapshot browser and warm-cache framing', () => {
    const benchmark = getHomeBrowserCSSCost()
    const browser = browserCSSCostSnapshot.browser

    assert.equal(benchmark.cacheModeLabel, 'Warm-cache median')
    assert.equal(benchmark.browserLabel, browser ? `${browser.name} ${browser.version}` : 'Chromium')
})
