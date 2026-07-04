import assert from 'node:assert/strict'
import { test } from 'node:test'
import { benchmarkChartColors, bentoTiles, deliveryModes, diagnosticSignals, heroExampleClassNames, heroExampleCode, homeInteractions, homeSections } from '../app/[locale]/_home/home-content.js'

test('homepage section anchors and interaction hooks stay stable', () => {
    assert.deepEqual(Object.values(homeSections), [
        'hero',
        'css-cost',
        'design-system',
        'delivery-modes',
        'code-diagnostics',
        'get-started'
    ])

    assert.deepEqual(Object.values(homeInteractions), [
        'benchmark-row',
        'bento-tile',
        'cta-link'
    ])
})

test('hero example keeps a concise static Master CSS sample', () => {
    assert.deepEqual(heroExampleClassNames, [
        'grid gap:lg p:lg r:lg surface:raised',
        'text:muted',
        'font:2xl text:strong',
        'px:md py:sm r:md bg:yellow fg:yellow-95'
    ])

    for (const className of heroExampleClassNames) {
        assert.match(heroExampleCode, new RegExp(className.replaceAll(':', '\\:')))
    }
})

test('bento content model keeps four unique core styling tiles', () => {
    assert.equal(bentoTiles.length, 4)
    assert.equal(new Set(bentoTiles.map((tile) => tile.title)).size, bentoTiles.length)
    assert.equal(new Set(bentoTiles.map((tile) => tile.href)).size, bentoTiles.length)
    assert.equal(new Set(bentoTiles.map((tile) => tile.visual)).size, bentoTiles.length)
    assert.equal(bentoTiles.some((tile) => tile.title === 'Delivery modes'), false)
    assert.equal(bentoTiles.some((tile) => tile.title === 'Editor and linting'), false)

    for (const tile of bentoTiles) {
        assert.match(tile.href, /^\/guide\//)
        assert.match(tile.accent, /^bg:/)
        assert.match(tile.span, /@lg/)
        assert.equal(tile.sample.length, 3)
        assert.ok(tile.body.length > tile.title.length)
    }
})

test('delivery modes content model links to rendering mode sections', () => {
    assert.equal(deliveryModes.length, 3)
    assert.deepEqual(deliveryModes.map((mode) => mode.title), [
        'Runtime rendering',
        'Static rendering',
        'Progressive rendering'
    ])
    assert.equal(new Set(deliveryModes.map((mode) => mode.href)).size, deliveryModes.length)
    assert.equal(new Set(deliveryModes.map((mode) => mode.icon)).size, deliveryModes.length)

    for (const mode of deliveryModes) {
        assert.match(mode.href, /^\/guide\/rendering-modes#/)
        assert.match(mode.accent, /^bg:/)
        assert.ok(mode.body.length > mode.title.length)
        assert.ok(mode.signal.length > 0)
    }
})

test('diagnostic signal content model is agent-oriented and reviewable', () => {
    assert.equal(diagnosticSignals.length, 3)
    assert.deepEqual(diagnosticSignals.map((signal) => signal.status), ['context', 'lint', 'preview'])

    for (const signal of diagnosticSignals) {
        assert.match(signal.accent, /^bg:/)
        assert.ok(signal.body.length > signal.title.length)
    }
})

test('benchmark chart tones keep compact homepage palettes', () => {
    assert.deepEqual(benchmarkChartColors.cssVolume, ['bg:blue', 'bg:green', 'bg:yellow', 'bg:red'])
    assert.deepEqual(benchmarkChartColors.domScaling, ['bg:green', 'bg:yellow', 'bg:red'])
})
