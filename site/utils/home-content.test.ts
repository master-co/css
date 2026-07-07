import assert from 'node:assert/strict'
import { test } from 'node:test'
import guideColorNames from '../../internal/data/color-names.js'
import { COLOR_LEVELS } from '../../internal/data/color-palette.js'
import { benchmarkChartColors, bentoRows, deliveryModes, diagnosticSignals, heroExampleClassNames, heroExampleCode, homeInteractions, homeSections, p3PaletteColorNames, p3PaletteTiers } from '../app/[locale]/_home/home-content.js'

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
        'cta-link'
    ])
})

test('hero example keeps a concise static Master CSS sample', () => {
    assert.deepEqual(heroExampleClassNames, [
        'grid gap:lg p:lg r:3xl surface:raised',
        'text:muted',
        'font:2xl text:strong',
        'px:md py:sm r:xl bg:yellow fg:yellow-95'
    ])

    for (const className of heroExampleClassNames) {
        assert.match(heroExampleCode, new RegExp(className.replaceAll(':', '\\:')))
    }
})

test('bento content model keeps targeted layout tiles', () => {
    assert.equal(bentoRows.length, 3)
    assert.equal(new Set(bentoRows.map((row) => row.title)).size, bentoRows.length)
    assert.deepEqual(bentoRows.map((row) => row.title), [
        'Two-column grid',
        'High-saturation P3 colors',
        'Three-column grid'
    ])
    assert.deepEqual(bentoRows.map((row) => row.gridClassName), [
        'grid-cols:1 grid-cols:2@md',
        'grid-cols:1',
        'grid-cols:1 grid-cols:3@md'
    ])
    assert.deepEqual(bentoRows.map((row) => row.gridCount), [2, 1, 3])
    assert.deepEqual(bentoRows.map((row) => row.visual || 'placeholder'), ['placeholder', 'p3-palette', 'placeholder'])
    assert.equal(bentoRows.some((row) => row.title === 'Delivery modes'), false)
    assert.equal(bentoRows.some((row) => row.title === 'Editor and linting'), false)
    assert.equal(bentoRows.some((row) => row.title === 'Single-column grid'), false)

    for (const row of bentoRows) {
        assert.ok(row.body.length > row.title.length)
    }
})

test('homepage P3 palette preview uses every guide color in reverse order', () => {
    assert.deepEqual(p3PaletteColorNames, [...guideColorNames].reverse())
    assert.deepEqual(p3PaletteTiers, [...COLOR_LEVELS].reverse())
    assert.equal(new Set(p3PaletteColorNames).size, p3PaletteColorNames.length)
    assert.equal(p3PaletteColorNames.length, guideColorNames.length)
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
