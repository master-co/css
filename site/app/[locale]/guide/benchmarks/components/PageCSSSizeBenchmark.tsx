import snapshot from '~/site/../benchmarks/docs-page-css-size/snapshot.json'
import brands from 'internal/data/brands'
import Bar from 'internal/components/Bar'
import Bars from 'internal/components/Bars'
import Segments from 'internal/components/Segments'
import Link from 'internal/components/Link'

import clsx from 'clsx'

const pages = snapshot.pages
const masterCSSPage = pages.find((page) => page.name === 'Master CSS') || pages[0]

const maxTotalRawBytes = Math.max(...pages.map((page) => page.css.total.rawBytes))
const maxTotalBrotliBytes = Math.max(...pages.map((page) => page.css.total.brotliBytes))
const detailClassName = 'min-w:0 overflow:hidden text-ellipsis white-space:nowrap font:2xs text:muted'

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

export default () => (
  <figure>
    <Segments>
      {[
        {
          name: 'Raw',
          content: (
            <Bars>
              {[...pages]
                .sort((a, b) => a.css.total.rawBytes - b.css.total.rawBytes)
                .map((page) => {
                  const brand = Object.values(brands).find((brand) => brand.name === page.name)
                  return (
                    <Bar key={page.name}
                      color={brand?.color}
                      value={page.css.total.rawBytes / 1000}
                      max={maxTotalRawBytes / 1000}
                      width={'60%'}
                      suffix='kB'
                      animated
                      icon={brand?.src && <brand.src width={24} height={24} className={clsx('mx:0', brand?.className)} />}>
                      {page.name !== 'Master CSS' && <div className={detailClassName}><span className='hidden@<sm'>{page.name}, </span> {formatRatio(page.css.total.rawBytes, masterCSSPage.css.total.rawBytes)}x larger</div>}
                      {page.name === 'Master CSS' && (
                        <div className={clsx(detailClassName, 'hidden@<sm')}>( {formatMasterCSSBreakdown('rawBytes')} )</div>
                      )}
                    </Bar>
                  )
                })}
            </Bars>
          )
        },
        {
          name: 'Brotli',
          content: (
            <Bars>
              {[...pages]
                .sort((a, b) => a.css.total.brotliBytes - b.css.total.brotliBytes)
                .map((page) => {
                  const brand = Object.values(brands).find((brand) => brand.name === page.name)
                  return (
                    <Bar key={page.name}
                      color={brand?.color}
                      value={page.css.total.brotliBytes / 1000}
                      max={maxTotalBrotliBytes / 1000}
                      width={maxTotalBrotliBytes / maxTotalRawBytes * 60 + '%'}
                      suffix='kB'
                      animated
                      icon={brand?.src && <brand.src width={24} height={24} className={clsx('mx:0', brand?.className)} />}>
                      {page.name !== 'Master CSS' && <div className={detailClassName}><span className='hidden@<sm'>{page.name}, </span> {formatRatio(page.css.total.brotliBytes, masterCSSPage.css.total.brotliBytes)}x larger</div>}
                      {page.name === 'Master CSS' && (
                        <div className={clsx(detailClassName, 'hidden@<sm')}>( {formatMasterCSSBreakdown('brotliBytes')} )</div>
                      )}
                    </Bar>
                  )
                })}
            </Bars>
          )
        }
      ]}
    </Segments>
    <figcaption>The <Link href="https://github.com/master-co/css/tree/rc/benchmarks/docs-page-css-size/snapshot.json">total size</Link> of inline and external styles on popular documentation sites.</figcaption>
  </figure>
)
