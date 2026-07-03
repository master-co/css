import snapshot from '~/site/../benchmarks/docs-page-css-size/snapshot.json'

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

export type HomePageCSSSizeModeId = 'brotli' | 'raw'

export type HomePageCSSSizeBreakdownPart = {
    bytes: number
    label: string
    valueLabel: string
}

export type HomePageCSSSizeRow = {
    bytes: number
    isMasterCSS: boolean
    name: string
    percent: number
    ratio: number
    ratioLabel: string
    url: string
    valueLabel: string
}

export type HomePageCSSSizeMode = {
    breakdown: HomePageCSSSizeBreakdownPart[]
    id: HomePageCSSSizeModeId
    label: string
    maxBytes: number
    masterLabel: string
    rows: HomePageCSSSizeRow[]
}

const pages = snapshot.pages as PageCSSSizePage[]
const masterCSSPage = pages.find((page) => page.name === 'Master CSS') || pages[0]

function formatNumber(value: number, maximumFractionDigits = 0) {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits }).format(value)
}

function formatKilobytes(bytes: number) {
    return `${formatNumber(bytes / 1000, 1)} kB`
}

function formatRatio(bytes: number, baselineBytes: number) {
    return Number((bytes / baselineBytes).toFixed(1))
}

function percent(value: number, max: number) {
    if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) return 0
    return Math.max(0, Math.min(100, value / max * 100))
}

function isMasterCSSStyle(asset: PageCSSAsset) {
    return asset.kind === 'inline' && (asset.tag === '<style id="master-css">' || asset.tag === '<style id="master">')
}

function sumAssetBytes(assets: PageCSSAsset[], kind: CSSSizeKind) {
    return assets.reduce((total, asset) => total + asset[kind], 0)
}

function createMasterBreakdown(kind: CSSSizeKind): HomePageCSSSizeBreakdownPart[] {
    const masterCSSBytes = sumAssetBytes(masterCSSPage.assets.filter(isMasterCSSStyle), kind)
    const otherInlineBytes = sumAssetBytes(masterCSSPage.assets.filter((asset) => asset.kind === 'inline' && !isMasterCSSStyle(asset)), kind)
    const externalCSSBytes = sumAssetBytes(masterCSSPage.assets.filter((asset) => asset.kind === 'external'), kind)

    return [
        { bytes: masterCSSBytes, label: 'Master CSS', valueLabel: formatKilobytes(masterCSSBytes) },
        { bytes: otherInlineBytes, label: 'Other inline', valueLabel: formatKilobytes(otherInlineBytes) },
        { bytes: externalCSSBytes, label: 'External CSS', valueLabel: formatKilobytes(externalCSSBytes) }
    ].filter((part) => part.bytes > 0)
}

function createRows(kind: CSSSizeKind): HomePageCSSSizeRow[] {
    const maxBytes = Math.max(...pages.map((page) => page.css.total[kind]))
    const masterBytes = masterCSSPage.css.total[kind]

    return [...pages]
        .sort((a, b) => a.css.total[kind] - b.css.total[kind])
        .map((page) => {
            const bytes = page.css.total[kind]
            const ratio = formatRatio(bytes, masterBytes)
            const isMasterCSS = page.name === masterCSSPage.name

            return {
                bytes,
                isMasterCSS,
                name: page.name,
                percent: percent(bytes, maxBytes),
                ratio,
                ratioLabel: isMasterCSS ? 'Baseline' : `${ratio.toFixed(1)}x larger`,
                url: page.url,
                valueLabel: formatKilobytes(bytes)
            }
        })
}

function createMode(id: HomePageCSSSizeModeId, label: string, kind: CSSSizeKind): HomePageCSSSizeMode {
    return {
        breakdown: createMasterBreakdown(kind),
        id,
        label,
        maxBytes: Math.max(...pages.map((page) => page.css.total[kind])),
        masterLabel: formatKilobytes(masterCSSPage.css.total[kind]),
        rows: createRows(kind)
    }
}

export function getHomePageCSSSize() {
    return {
        pageCount: pages.length,
        modes: [
            createMode('raw', 'Raw', 'rawBytes'),
            createMode('brotli', 'Brotli', 'brotliBytes')
        ],
        snapshotHref: 'https://github.com/master-co/css/tree/rc/benchmarks/docs-page-css-size/snapshot.json'
    }
}
