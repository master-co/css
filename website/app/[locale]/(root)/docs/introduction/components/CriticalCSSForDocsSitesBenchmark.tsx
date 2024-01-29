import results from '~/../benchmarks/critical-css-for-docs-sites/results.json'
import brands from 'websites/data/brands'
import Bar from '~/components/Bar'
import BarShape from '~/components/BarShape'
import Bars from '~/components/Bars'
import Link from 'websites/components/Link'
import Image from 'next/image'
import clsx from 'clsx'
import { filesize } from 'filesize'

const fileSizeOptions = { round: 0 }
const maxTotalCSSSize = Math.max(...results.map((result) => result.totalCSSSize))
const masterCSSResult = results.find((result) => result.name === 'Master CSS')

export default () => (
    <>
        <figure>
            <Bars>
                {results
                    .sort((a, b) => b.totalCSSSize - a.totalCSSSize)
                    .map((result) => {
                        const brand = brands[result.name as keyof typeof brands] as any
                        return (
                            <Bar key={result.name}>
                                {/* eslint-disable-next-line @master/css/class-validation */}
                                <BarShape className={`bg:${brand.color || 'text-lightest'}`} width={`calc(50% - (${maxTotalCSSSize} - ${result.totalCSSSize}) / ${maxTotalCSSSize} * 50%)`} animated />
                                <Image src={brand.src} width={24} height={24} alt={result.name} className={clsx('mx:0', brand.className)} />
                                {/* eslint-disable-next-line @master/css/class-validation */}
                                <b className={`fg:${brand.color || 'text-lightest'}`}>{filesize(result.totalCSSSize, fileSizeOptions)}</b>
                                {/* @ts-expect-error masterCSSResult?.totalCSSSize */}
                                {result.name !== 'Master CSS' && <small className='flex:1'><span className='hide@<sm'>{result.name}, </span> {(result?.totalCSSSize / masterCSSResult?.totalCSSSize).toFixed(1)}x larger</small>}
                            </Bar>
                        )
                    })}
            </Bars>
            <figcaption>The <Link href="https://github.com/master-co/css/tree/rc/benchmarks/critical-css-for-docs-sites/results.json">results</Link> are the raw size sum of internal CSS and external CSS, including font CSS</figcaption>
        </figure>
    </>
)
