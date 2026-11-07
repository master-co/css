import assert from 'node:assert/strict'
import { test } from 'node:test'
import { stabilizeIslandIds } from './stable-island-ids'

const island = (uid: string) => `<astro-island uid="${uid}" component-url="/_astro/SearchButton.js" props="{}" ssr client="load"><button>Search</button></astro-island>`

test('islands built from different checkout paths get the same uid', () => {
    assert.equal(stabilizeIslandIds(island('VdVrl')), stabilizeIslandIds(island('Z1Wof0z')))
})

test('the uid still follows the island identity', () => {
    const other = island('VdVrl').replace('SearchButton', 'DocHeader')
    assert.notEqual(stabilizeIslandIds(other), stabilizeIslandIds(island('VdVrl')))
    assert.match(stabilizeIslandIds(island('VdVrl')), /^<astro-island uid="[\w-]{8}" component-url="\/_astro\/SearchButton\.js"/)
})

test('markup without island uids is unchanged', () => {
    const html = '<astro-island component-url="/x.js"></astro-island><p uid="kept">text</p>'
    assert.equal(stabilizeIslandIds(html), html)
})
