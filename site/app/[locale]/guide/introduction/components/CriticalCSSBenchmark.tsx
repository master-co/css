import results from '~/site/../benchmarks/critical-css-for-docs-sites/results.json'
import brands from 'internal/data/brands'
import Bar from 'internal/components/Bar'
import Bars from 'internal/components/Bars'
import Segments from 'internal/components/Segments'
import Link from 'internal/components/Link'

import Image from 'next/image'
import clsx from 'clsx'

const masterCSSResult = results.find((result) => result.name === 'Master CSS')

const maxTotalCSSSize = Math.max(...results.map((result) => result.totalCSSSize))
const maxTotalCSSBrotliSize = Math.max(...results.map((result) => result.totalCSSBrotliSize))

export default () => (
    <figure>
        <Segments>
            {[
                {
                    name: 'Raw',
                    content: (
                        <Bars>
                            {results
                                .sort((a, b) => a.totalCSSSize - b.totalCSSSize)
                                .map((result) => {
                                    const brand = brands.find((brand) => brand.name === result.name)
                                    return (
                                        <Bar key={result.name}
                                            color={brand?.color}
                                            value={result.totalCSSSize / 1000}
                                            max={maxTotalCSSSize / 1000}
                                            width={'60%'}
                                            suffix='kB'
                                            animated
                                            icon={<Image src={brand?.src} width={24} height={24} alt={brand?.name || ''} className={clsx('mx:0', brand?.className)} />}>
                                            {/* @ts-expect-error masterCSSResult?.totalCSSSize */}
                                            {result.name !== 'Master CSS' && <div className='flex:1 font:10'><span className='hidden@<sm'>{result.name}, </span> {(result?.totalCSSSize / masterCSSResult?.totalCSSSize).toFixed(1)}x larger</div>}
                                            {result.name === 'Master CSS' && (
                                                <div className='flex:1 font:10'>( {(result?.internals[1].size / 1000).toFixed(1)} kB + Font {(result?.internals[0].size / 1000).toFixed(1)} kB + Normal {(result?.externals[0].size / 1000).toFixed(1)} kB )</div>
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
                            {results
                                .sort((a, b) => a.totalCSSBrotliSize - b.totalCSSBrotliSize)
                                .map((result) => {
                                    const brand = brands.find((brand) => brand.name === result.name)
                                    return (
                                        <Bar key={result.name}
                                            color={brand?.color}
                                            value={result.totalCSSBrotliSize / 1000}
                                            max={maxTotalCSSBrotliSize / 1000}
                                            width={maxTotalCSSBrotliSize / maxTotalCSSSize * 60 + '%'}
                                            suffix='kB'
                                            animated
                                            icon={<Image src={brand?.src} width={24} height={24} alt={brand?.name || ''} className={clsx('mx:0', brand?.className)} />}>
                                            {/* @ts-expect-error masterCSSResult?.totalCSSSize */}
                                            {result.name !== 'Master CSS' && <div className='flex:1 font:10'><span className='hidden@<sm'>{result.name}, </span> {(result?.totalCSSBrotliSize / masterCSSResult?.totalCSSBrotliSize).toFixed(1)}x larger</div>}
                                            {result.name === 'Master CSS' && (
                                                <div className='flex:1 font:10'>( {(result?.internals[1].brotliSize / 1000).toFixed(1)} kB + Font {(result?.internals[0].brotliSize / 1000).toFixed(1)} kB + Normal {(result?.externals[0].brotliSize / 1000).toFixed(1)} kB )</div>
                                            )}
                                        </Bar>
                                    )
                                })}
                        </Bars>
                    )
                }
            ]}
        </Segments>
        <figcaption>The <Link href="https://github.com/master-co/css/tree/rc/benchmarks/critical-css-for-docs-sites/results.json">results</Link> are the size sum of internal CSS and external CSS, including font CSS</figcaption>
    </figure>
)
