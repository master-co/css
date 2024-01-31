import results from '~/../benchmarks/critical-css-for-docs-sites/results.json'
import brands from 'websites/data/brands'
import Bar from '~/components/Bar'
import Bars from '~/components/Bars'
import Segments from 'websites/components/Segments'
import Link from 'websites/components/Link'

import Image from 'next/image'
import clsx from 'clsx'

const maxTotalCSSSize = Math.max(...results.map((result) => result.totalCSSSize))
const maxTotalCSSBrotliSize = Math.max(...results.map((result) => result.totalCSSBrotliSize))
const masterCSSResult = results.find((result) => result.name === 'Master CSS')

export default () => (
    <Segments>
        {[
            {
                name: 'Raw',
                content: (
                    <figure>
                        <Bars>
                            {results
                                .sort((a, b) => b.totalCSSSize - a.totalCSSSize)
                                .map((result) => {
                                    const brand = brands[result.name as keyof typeof brands] as any
                                    return (
                                        <Bar key={result.name}
                                            color={brand.color}
                                            value={result.totalCSSSize / 1000}
                                            max={maxTotalCSSSize / 1000}
                                            width='60%'
                                            suffix='kB'
                                            animated
                                            icon={<Image src={brand.src} width={24} height={24} alt={result.name} className={clsx('mx:0', brand.className)} />}>
                                            {/* @ts-expect-error masterCSSResult?.totalCSSSize */}
                                            {result.name !== 'Master CSS' && <div className='flex:1 font:12'><span className='hide@<sm'>{result.name}, </span> {(result?.totalCSSSize / masterCSSResult?.totalCSSSize).toFixed(1)}x larger</div>}
                                            {result.name === 'Master CSS' && (
                                                <div className='flex:1 font:12'>Page {(result?.internals[1].size / 1000).toFixed(1)} kB + Font {(result?.internals[0].size / 1000).toFixed(1)} kB + Normalize {(result?.externals[0].size / 1000).toFixed(1)} kB</div>
                                            )}
                                        </Bar>
                                    )
                                })}
                        </Bars>
                        <figcaption>The <Link href="https://github.com/master-co/css/tree/rc/benchmarks/critical-css-for-docs-sites/results.json">results</Link> are the raw size sum of internal CSS and external CSS, including font CSS</figcaption>
                    </figure>
                )
            },
            {
                name: 'Brotli',
                content: (
                    <figure>
                        <Bars>
                            {results
                                .sort((a, b) => b.totalCSSBrotliSize - a.totalCSSBrotliSize)
                                .map((result) => {
                                    const brand = brands[result.name as keyof typeof brands] as any
                                    return (
                                        <Bar key={result.name}
                                            color={brand.color}
                                            value={result.totalCSSBrotliSize / 1000}
                                            max={maxTotalCSSBrotliSize / 1000}
                                            width='60%'
                                            suffix='kB'
                                            animated
                                            icon={<Image src={brand.src} width={24} height={24} alt={result.name} className={clsx('mx:0', brand.className)} />}>
                                            {/* @ts-expect-error masterCSSResult?.totalCSSSize */}
                                            {result.name !== 'Master CSS' && <div className='flex:1 font:12'><span className='hide@<sm'>{result.name}, </span> {(result?.totalCSSBrotliSize / masterCSSResult?.totalCSSBrotliSize).toFixed(1)}x larger</div>}
                                            {result.name === 'Master CSS' && (
                                                <div className='flex:1 font:12'>Page {(result?.internals[1].brotliSize / 1000).toFixed(1)} kB + Font {(result?.internals[0].brotliSize / 1000).toFixed(1)} kB + Normalize {(result?.externals[0].brotliSize / 1000).toFixed(1)} kB</div>
                                                )}
                                        </Bar>
                                    )
                                })}
                        </Bars>
                        <figcaption>The <Link href="https://github.com/master-co/css/tree/rc/benchmarks/critical-css-for-docs-sites/results.json">results</Link> are the brotli size sum of internal CSS and external CSS, including font CSS</figcaption>
                    </figure>
                )
            }
        ]}
    </Segments>
)
