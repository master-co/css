import Article from 'websites/components/Article'
import DocHeader from '~/layouts/DocHeader'
import DocFooter from '~/layouts/DocFooter'
import { queryDictionary } from 'websites/dictionaries'
// @ts-expect-error
import allBlogMetadata from './*/metadata.js'
import Image from 'next/image'
import { l } from 'to-line'
import dayjs from 'dayjs'
import Link from 'websites/components/Link'
import metadata from './metadata.js'
import { generate } from '~/utils/metadata'

export async function generateMetadata(props: any, parent: any) {
    return generate(metadata, props, parent)
}

export default async function Page(props: any) {
    const $ = await queryDictionary(props.params.locale)
    return <>
        <DocHeader DocHeader contained locale={props.params.locale} />
        <main className='app-doc-main max-w:xl'>
            <Article className="mb:80" type="article">
                <div className='gap:50|25 grid-cols:4'>
                    {allBlogMetadata.concat(allBlogMetadata, allBlogMetadata, allBlogMetadata, allBlogMetadata, allBlogMetadata, allBlogMetadata, allBlogMetadata, allBlogMetadata, allBlogMetadata, allBlogMetadata, allBlogMetadata)
                        .map((eachBlogMetadata: any, index: number) => {
                            const formattedDate = dayjs(eachBlogMetadata.date).format('ddd, MMMM D YYYY')
                            return (
                                <Link href="/blog/v2" className={l('text-decoration:none!', { 'grid-col-span:2 flex flex:col': index < 2 })} key={eachBlogMetadata.date}>
                                    <Image src="/images/gold-pattern.jpg"
                                        className={l('aspect:16/9 r:5 h:auto w:full flex:1')}
                                        width={480}
                                        height={270}
                                        alt={eachBlogMetadata.title} />
                                    <div className='text:12 fg:accent font:medium mt:10'>{formattedDate}</div>
                                    <div className='text:18 fg:major font:semibold'>{eachBlogMetadata.title}</div>
                                    <div className='text:14 fg:major font:regular'>{eachBlogMetadata.description}</div>
                                </Link>
                            )
                        })}
                </div>
            </Article>
            <DocFooter locale={props.params.locale} title={metadata.title} />
        </main>
    </>


}