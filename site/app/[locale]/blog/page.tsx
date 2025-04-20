import DocHeader from 'internal/components/DocHeader'
import Footer from 'internal/components/Footer'
import pageCategories from 'site/.categories/blog.json'
import Image from 'next/image'
import clsx from 'clsx'
import dayjs from 'dayjs'
import Link from 'internal/components/Link'
import metadata from './metadata'
import generate from 'internal/utils/generate-metadata'
import HeroHeader from 'internal/components/HeroHeader'
import AuthorList from 'internal/components/AuthorList'
import TimeAgo from 'internal/components/TimeAgo'

export const dynamic = 'force-static'
export const revalidate = false

export async function generateMetadata(props: any, parent: any) {
    return await generate(metadata, props, parent)
}

export default async function Page(props: any) {
    const { locale } = await props.params
    return <>
        <main className='px:5x'>
            <HeroHeader metadata={metadata} />
            <div className="mx:auto my:18x max-w:screen-md prose my:30x@sm">
                <div className='gap:8x grid-cols:1 grid-cols:2@sm'>
                    {pageCategories
                        .map(({ pages }) => pages)
                        .flat()
                        .map((page: any, index: number) => {
                            const formattedDate = dayjs(page.date).format('ddd, MMMM D YYYY')
                            return (
                                <Link key={page.pathname} href={page.pathname} className={clsx('gap:4x outline:1|frame-lightest p:6x r:5x grid-cols:1 bg:base shadow:x2')}>
                                    <div className="flex justify-content:space-between mb:-1x">
                                        <div className='text:14 fg:accent'>{formattedDate}</div>
                                        <div className='text:14 fg:light'> <TimeAgo timestamp={page.date} /></div>
                                    </div>
                                    <div className='text:pretty my:-1x font:24 leading:1.4'>{page.title}</div>
                                    <AuthorList size="sm" className="my:1x">{page.authors}</AuthorList>
                                    {/* <Image src="/images/gold-pattern.jpg"  className="r:5 aspect:16/9 h:auto" width={480} height={270} alt={page.title} /> */}
                                    <div className='text:pretty text:14 fg:neutral'>{page.description}</div>
                                </Link>
                            )
                            })
                    }
                </div>
            </div>
        </main>
        <hr className="hr" />
        <Footer className="px:5x mb:30x" locale={locale} />
    </>


}