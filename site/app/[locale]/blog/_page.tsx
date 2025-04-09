import DocHeader from 'internal/components/DocHeader'
import DocFooter from 'internal/components/DocFooter'
// @ts-expect-error
import allBlogMetadata from './*/metadata.js'
import Image from 'next/image'
import clsx from 'clsx'
import dayjs from 'dayjs'
import Link from 'internal/components/Link'
import metadata from './metadata'
import generate from 'internal/utils/generate-metadata'

export const dynamic = 'force-static'
export const revalidate = false

export async function generateMetadata(props: any, parent: any) {
    return await generate(metadata, props, parent)
}

export default async function Page(props: any) {
    const { locale } = await props.params
    return <>
        <DocHeader />
        <main className='app-doc-main max-w:screen-xl'>
            <div className="mb:80 prose">
                <div className='gap:12x|25 grid-cols:4'>
                    {allBlogMetadata.concat(allBlogMetadata, allBlogMetadata, allBlogMetadata, allBlogMetadata, allBlogMetadata, allBlogMetadata, allBlogMetadata, allBlogMetadata, allBlogMetadata, allBlogMetadata, allBlogMetadata)
                        .map((eachBlogMetadata: any, index: number) => {
                            const formattedDate = dayjs(eachBlogMetadata.date).format('ddd, MMMM D YYYY')
                            return (
                                <Link href="/blog/v2" className={clsx('text-decoration:none!', { 'flex grid-col-span:2 flex:col': index < 2 })} key={eachBlogMetadata.date}>
                                    <Image src="/images/gold-pattern.jpg"
                                        className={clsx('flex:1 r:5 aspect:16/9 h:auto w:full')}
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
            </div>
            <DocFooter locale={locale} />
        </main>
    </>


}