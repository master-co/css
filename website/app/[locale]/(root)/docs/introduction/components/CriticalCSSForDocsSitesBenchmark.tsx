import results from '~/../benchmarks/critical-css-for-docs-sites/results.json'
import brands from 'websites/data/brands'
import Bar from '~/components/Bar'
import Bars from '~/components/Bars'
import Segments from 'websites/components/Segments'
import Link from 'websites/components/Link'

import Image from 'next/image'
import clsx from 'clsx'

const masterCSSResult = results.find((result) => result.name === 'Master CSS')

const Content = ({ maxTotalCSSSize, totalSizeKey, sizeKey, maxWidth }) =>
    <figure>
        <Bars>
            {results
                .sort((a, b) => b.totalCSSSize - a.totalCSSSize)
                .map((result) => {
                    const brand = brands.find((brand) => brand.name === result.name)
                    return (
                        <Bar key={result.name}
                            color={brand?.color}
                            value={result[totalSizeKey] / 1000}
                            max={maxTotalCSSSize / 1000}
                            width={maxWidth + '%'}
                            suffix='kB'
                            animated
                            icon={<Image src={brand?.src} width={24} height={24} alt={result.name} className={clsx('mx:0', brand?.className)} />}>
                            {/* @ts-expect-error masterCSSResult?.totalCSSSize */}
                            {result.name !== 'Master CSS' && <div className='flex:1 font:10'><span className='hide@<sm'>{result.name}, </span> {(result?.[totalSizeKey] / masterCSSResult?.[totalSizeKey]).toFixed(1)}x larger</div>}
                            {result.name === 'Master CSS' && (
                                <div className='flex:1 font:10'>( {(result?.internals[1][sizeKey] / 1000).toFixed(1)} kB + Font {(result?.internals[0][sizeKey] / 1000).toFixed(1)} kB + Normal {(result?.externals[0][sizeKey] / 1000).toFixed(1)} kB )</div>
                            )}
                        </Bar>
                    )
                })}
        </Bars>
        <figcaption>The <Link href="https://github.com/master-co/css/tree/rc/benchmarks/critical-css-for-docs-sites/results.json">results</Link> are the size sum of internal CSS and external CSS, including font CSS</figcaption>
    </figure>


const maxTotalCSSSize = Math.max(...results.map((result) => result.totalCSSSize))
const maxTotalCSSBrotliSize = Math.max(...results.map((result) => result.totalCSSBrotliSize))

export default () => (
    <Segments>
        {[
            {
                name: 'Raw',
                content: <Content totalSizeKey="totalCSSSize" sizeKey="size" maxTotalCSSSize={maxTotalCSSSize} maxWidth={60} />
            },
            {
                name: 'Brotli',
                content: <Content totalSizeKey="totalCSSBrotliSize" sizeKey="brotliSize" maxTotalCSSSize={maxTotalCSSBrotliSize} maxWidth={maxTotalCSSBrotliSize / maxTotalCSSSize * 60} />
            }
        ]}
    </Segments>
)
