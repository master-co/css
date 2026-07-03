import assert from 'node:assert/strict'
import { test } from 'node:test'
import { benchmarkChartColors, bentoTiles, heroExampleClassNames, heroExampleCode, homeInteractions, homeSections } from '../app/[locale]/_home/home-content.js'

test('homepage section anchors and interaction hooks stay stable', () => {
    assert.deepEqual(Object.values(homeSections), [
        'hero',
        'css-cost',
        'design-system',
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

test('bento content model keeps six unique capability tiles', () => {
    assert.equal(bentoTiles.length, 6)
    assert.equal(new Set(bentoTiles.map((tile) => tile.title)).size, bentoTiles.length)
    assert.equal(new Set(bentoTiles.map((tile) => tile.href)).size, bentoTiles.length)
    assert.equal(new Set(bentoTiles.map((tile) => tile.visual)).size, bentoTiles.length)

    for (const tile of bentoTiles) {
        assert.match(tile.href, /^\/guide\//)
        assert.match(tile.accent, /^bg:/)
        assert.match(tile.span, /@lg/)
        assert.equal(tile.sample.length, 3)
        assert.ok(tile.body.length > tile.title.length)
    }
})

test('benchmark chart tones keep compact homepage palettes', () => {
    assert.deepEqual(benchmarkChartColors.cssVolume, ['bg:blue', 'bg:green', 'bg:yellow', 'bg:red'])
    assert.deepEqual(benchmarkChartColors.domScaling, ['bg:green', 'bg:yellow', 'bg:red'])
})
