import assert from 'node:assert/strict'
import { test } from 'node:test'
import snapshot from '../../benchmarks/docs-page-css-size/snapshot.json'
import { getHomePageCSSSize } from './home-page-css-size.js'

type CSSSizeKind = 'brotliBytes' | 'rawBytes'

type PageCSSAsset = {
    kind: 'external' | 'inline'
    tag?: string
    rawBytes: number
    brotliBytes: number
}

type PageCSSSizePage = {
    name: string
    url: string
    css: {
        total: Record<CSSSizeKind, number>
    }
    assets: PageCSSAsset[]
}

const pageCSSSizeSnapshot = snapshot as {
    pages: PageCSSSizePage[]
}

const masterCSSPage = pageCSSSizeSnapshot.pages.find((page) => page.name === 'Master CSS') || pageCSSSizeSnapshot.pages[0]

function isMasterCSSStyle(asset: PageCSSAsset) {
    return asset.kind === 'inline' && (asset.tag === '<style id="master-css">' || asset.tag === '<style id="master">')
}

function sumAssetBytes(assets: PageCSSAsset[], kind: CSSSizeKind) {
    return assets.reduce((total, asset) => total + asset[kind], 0)
}

test('homepage page CSS size data is derived from the committed page snapshot', () => {
    const benchmark = getHomePageCSSSize()

    assert.equal(benchmark.pageCount, pageCSSSizeSnapshot.pages.length)
    assert.equal(benchmark.snapshotHref.endsWith('/benchmarks/docs-page-css-size/snapshot.json'), true)

    for (const [modeId, kind] of [['raw', 'rawBytes'], ['brotli', 'brotliBytes']] as const) {
        const mode = benchmark.modes.find((eachMode) => eachMode.id === modeId)
        assert.ok(mode)

        const expectedPages = [...pageCSSSizeSnapshot.pages].sort((a, b) => a.css.total[kind] - b.css.total[kind])
        const maxBytes = Math.max(...pageCSSSizeSnapshot.pages.map((page) => page.css.total[kind]))

        assert.equal(mode.maxBytes, maxBytes)
        assert.deepEqual(mode.rows.map((row) => row.name), expectedPages.map((page) => page.name))
        assert.equal(Math.max(...mode.rows.map((row) => row.percent)), 100)

        for (const row of mode.rows) {
            const page = pageCSSSizeSnapshot.pages.find((eachPage) => eachPage.name === row.name)
            assert.ok(page)

            const bytes = page.css.total[kind]
            const ratio = Number((bytes / masterCSSPage.css.total[kind]).toFixed(1))

            assert.equal(row.bytes, bytes)
            assert.equal(row.url, page.url)
            assert.equal(row.valueLabel.endsWith(' kB'), true)
            assert.equal(row.ratio, ratio)
            assert.equal(row.ratioLabel, row.isMasterCSS ? 'Baseline' : `${ratio.toFixed(1)}x larger`)
            assert.equal(row.percent >= 0 && row.percent <= 100, true)
            assert.equal(row.isMasterCSS, page.name === 'Master CSS')
        }
    }
})

test('homepage Master CSS page size breakdown stays snapshot-backed', () => {
    const benchmark = getHomePageCSSSize()

    for (const [modeId, kind] of [['raw', 'rawBytes'], ['brotli', 'brotliBytes']] as const) {
        const mode = benchmark.modes.find((eachMode) => eachMode.id === modeId)
        assert.ok(mode)

        const expectedBreakdown = [
            { bytes: sumAssetBytes(masterCSSPage.assets.filter(isMasterCSSStyle), kind), label: 'Master CSS' },
            { bytes: sumAssetBytes(masterCSSPage.assets.filter((asset) => asset.kind === 'inline' && !isMasterCSSStyle(asset)), kind), label: 'Other inline' },
            { bytes: sumAssetBytes(masterCSSPage.assets.filter((asset) => asset.kind === 'external'), kind), label: 'External CSS' }
        ].filter((part) => part.bytes > 0)

        assert.equal(mode.masterLabel.endsWith(' kB'), true)
        assert.deepEqual(
            mode.breakdown.map(({ bytes, label }) => ({ bytes, label })),
            expectedBreakdown
        )
        assert.equal(
            mode.breakdown.reduce((total, part) => total + part.bytes, 0),
            masterCSSPage.css.total[kind]
        )
    }
})
