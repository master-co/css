'use client'

import Article from 'websites/components/Article'
import DocHeader from '~/components/DocHeader.jsx'
import DocFooter from '~/components/DocFooter.jsx'
// @ts-expect-error
import allBlogMetadata from './*/metadata.js'
import Image from 'next/image'
import clsx from 'clsx'
import dayjs from 'dayjs'
import Link from 'websites/components/Link'
import metadata from './metadata.js'
import { generate } from '~/utils/metadata'

export const dynamic = 'force-static'
export const revalidate = false

export async function generateMetadata(props: any, parent: any) {
    return generate(metadata, props, parent)
}

export default function Page(props: any) {
    return <>
        <DocHeader contained locale={props.params.locale} />
        <main className='app-doc-main max-w:screen-xl'>
            <Article className="mb:80" prose>
                <div className='gap:12x|25 grid-cols:4'>
                    {allBlogMetadata.concat(allBlogMetadata, allBlogMetadata, allBlogMetadata, allBlogMetadata, allBlogMetadata, allBlogMetadata, allBlogMetadata, allBlogMetadata, allBlogMetadata, allBlogMetadata, allBlogMetadata)
                        .map((eachBlogMetadata: any, index: number) => {
                            const formattedDate = dayjs(eachBlogMetadata.date).format('ddd, MMMM D YYYY')
                            return (
                                <Link href="/blog/v2" className={clsx('text-decoration:none!', { 'grid-col-span:2 flex flex:col': index < 2 })} key={eachBlogMetadata.date}>
                                    <Image src="/images/gold-pattern.jpg"
                                        className={clsx('aspect:16/9 r:5 h:auto w:full flex:1')}
                                        width={480}
                                        height={270}
                                        alt={eachBlogMetadata.title} />
                                    <div className='text:12 fg:accent font:medium mt:10'>{formattedDate}</div>
                                    <div className='text:18 fg:strong font:semibold'>{eachBlogMetadata.title}</div>
                                    <div className='text:14 fg:strong font:regular'>{eachBlogMetadata.description}</div>
                                </Link>
                            )
                        })}
                </div>
            </Article>
            <DocFooter locale={props.params.locale} title={metadata.title} />
        </main>
    </>


}