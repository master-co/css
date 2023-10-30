import Article from 'shared/components/Article';
import DocHeader from '~/layouts/DocHeader';
import DocFooter from '~/layouts/DocFooter';
import { queryDictionary } from 'shared/dictionaries';
// @ts-expect-error
import allBlogMetadata from './*/metadata.ts'
import Image from 'next/image';
import { l } from 'to-line';
import dayjs from 'dayjs';
import Link from 'shared/components/Link';
import metadata from './metadata'
import { generate } from '~/utils/metadata'

export async function generateMetadata(props: any, parent: any) {
    return generate(metadata, props, parent)
}

export default async function Page(props: any) {
    const $ = await queryDictionary(props.params.locale)
    return <>
        {/* @ts-expect-error server component */}
        <DocHeader DocHeader contained locale={props.params.locale} />
        <main className='app-doc-main max-w:xl'>
            <Article className="mb:80" type="article">
                <div className='grid-cols:4 gap:50|25'>
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
                                    <div className='text:12 font:medium fg:accent mt:10'>{formattedDate}</div>
                                    <div className='text:18 font:semibold fg:major'>{eachBlogMetadata.title}</div>
                                    <div className='text:14 font:regular fg:neutral fg:major'>{eachBlogMetadata.description}</div>
                                </Link>
                            )
                        })}
                </div>
            </Article>
            {/* @ts-expect-error server component */}
            <DocFooter locale={props.params.locale} title={metadata.title} />
        </main>
    </>


}