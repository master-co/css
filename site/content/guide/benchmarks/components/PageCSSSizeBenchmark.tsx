import snapshot from '~/site/.generated/benchmarks/docs-page-css-size.json'
import brands from '~/site/docs-shell/data/brands'
import Segments from '~/site/docs-shell/components/Segments'
import Link from '~/site/docs-shell/components/Link'
import { BenchmarkBars, type BenchmarkBarItem } from '~/site/components/benchmarks'

import clsx from 'clsx'

const pages = snapshot.pages
const masterCSSPage = pages.find((page) => page.name === 'Master CSS') || pages[0]

const maxTotalRawBytes = Math.max(...pages.map((page) => page.css.total.rawBytes))

// Repeated tab panels must not share the internal IDs of an inline brand SVG.
const brandImages: Record<string, string> = {
  mastercss: '/images/logo.svg',
  tailwindcss: '/images/tailwindcss.svg',
  bootstrap: '/images/bootstrap.svg',
  mui: '/images/mui.svg',
  nextjs: '/images/frameworks/nextjs.svg',
  angular: '/images/frameworks/angular.svg',
  vuejs: '/images/frameworks/vuejs.svg',
  react: '/images/frameworks/react.svg'
}

function formatKilobytes(bytes: number) {
  return (bytes / 1000).toFixed(1)
}

function formatRatio(bytes: number, baselineBytes: number) {
  return (bytes / baselineBytes).toFixed(1)
}

function isMasterCSSStyle(asset: typeof masterCSSPage.assets[number]) {
  return asset.kind === 'inline' && (asset.tag === '<style id="master-css">' || asset.tag === '<style id="master">')
}

function sumAssetBytes(assets: typeof masterCSSPage.assets, kind: 'rawBytes' | 'brotliBytes') {
  return assets.reduce((total, asset) => total + asset[kind], 0)
}

function formatMasterCSSBreakdown(kind: 'rawBytes' | 'brotliBytes') {
  const masterCSSBytes = sumAssetBytes(masterCSSPage.assets.filter(isMasterCSSStyle), kind)
  const otherInlineBytes = sumAssetBytes(masterCSSPage.assets.filter((asset) => asset.kind === 'inline' && !isMasterCSSStyle(asset)), kind)
  const externalCSSBytes = sumAssetBytes(masterCSSPage.assets.filter((asset) => asset.kind === 'external'), kind)

  return [
    masterCSSBytes > 0 && `Master CSS ${formatKilobytes(masterCSSBytes)} kB`,
    otherInlineBytes > 0 && `Other inline ${formatKilobytes(otherInlineBytes)} kB`,
    externalCSSBytes > 0 && `External CSS ${formatKilobytes(externalCSSBytes)} kB`
  ].filter(Boolean).join(' + ')
}

function items(kind: 'rawBytes' | 'brotliBytes'): BenchmarkBarItem[] {
  return [...pages].sort((a, b) => a.css.total[kind] - b.css.total[kind]).map(page => {
    const [brandKey, brand] = Object.entries(brands).find(([, brand]) => brand.name === page.name) ?? []
    const image = brandKey && brandImages[brandKey]
    return {
      id: page.name,
      label: page.name,
      value: page.css.total[kind] / 1000,
      valueLabel: `${formatKilobytes(page.css.total[kind])} kB`,
      detail: page.name === 'Master CSS' ? formatMasterCSSBreakdown(kind) : `${formatRatio(page.css.total[kind], masterCSSPage.css.total[kind])}× Master CSS`,
      color: page.name === 'Master CSS' ? 'blue' : 'neutral',
    icon: image && <img src={image} alt="" width={20} height={20} className={clsx('flex:none height:20px width:20px margin-inline:0 object-fit:contain', brand?.className)} />
    }
  })
}

export default () => (
  <figure className="page-css-benchmark">
    <Segments label="CSS transfer size">{[
      { name: 'Raw', content: <BenchmarkBars items={items('rawBytes')} max={maxTotalRawBytes / 1000} unit="kB" /> },
      { name: 'Brotli', content: <BenchmarkBars items={items('brotliBytes')} max={maxTotalRawBytes / 1000} unit="kB" /> }
    ]}</Segments>
    <p className="font-xs fg-text-muted">Both views use the same scale and the committed page snapshot.</p>
    <figcaption>The <Link href="https://github.com/master-co/css/tree/rc/benchmarks/docs-page-css-size/snapshot.json">total size</Link> of inline and external styles on popular documentation sites.</figcaption>
  </figure>
)
