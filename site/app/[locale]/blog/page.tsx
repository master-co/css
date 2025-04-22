import DocHeader from 'internal/components/DocHeader'
import Footer from 'internal/components/Footer'
import pageCategories from 'site/.categories/blog.json'
import Image from 'next/image'
import clsx from 'clsx'
import dayjs from 'dayjs'
import Link from 'internal/components/Link'
import metadata from './metadata'
import generate from 'internal/utils/generate-metadata'
import dictionaries from '~/site/dictionaries'
import HeroHeader from 'internal/components/HeroHeader'
import AuthorList from 'internal/components/AuthorList'
import TimeAgo from 'internal/components/TimeAgo'

export const dynamic = 'force-static'
export const revalidate = false

export async function generateMetadata(props: any, parent: any) {
    return await generate(metadata, props, dictionaries, parent)
}

export default async function Page(props: any) {
    const { locale } = await props.params
    return <>
        <main className='px:5x pt:12x pt:15x@sm'>
            <div className="mx:auto my:18x max-w:screen-md prose my:30x@sm">
                <div className='bl:1|dotted|frame-lighter bt:1|dotted|frame-lighter grid-cols:1 grid-cols:2@sm grid-cols:3@md'>
                    {pageCategories
                        .map(({ pages }) => pages)
                        .flat()
                        .map((page: any, index: number) => {
                            const formattedDate = dayjs(page.date).format('ddd, MMMM D')
                            return (
                                <div key={page.pathname + index} className={clsx('bb:1|dotted|frame-lighter br:1|dotted|frame-lighter')}>
                                    <Link href={page.pathname} className={clsx('~background-color|.2s gap:5x p:6x grid-cols:1 bg:surface:hover p:12x@sm')}>
                                        <div className="flex justify-content:space-between mb:-1x">
                                            <div className='text:12 fg:accent'>{formattedDate}</div>
                                            <div className='text:12 fg:light'> <TimeAgo timestamp={page.date} /></div>
                                        </div>
                                        <div className='text:pretty my:-1x font:20 leading:1.4'>{page.title}</div>
                                        {/* <Image src="/images/gold-pattern.jpg"  className="r:5 aspect:16/9 h:auto" width={480} height={270} alt={page.title} /> */}
                                        <div className='text:pretty text:12 fg:neutral'>{page.description}</div>
                                        <AuthorList size="xs" className="my:1x">{page.authors}</AuthorList>
                                    </Link>
                                </div>
                            )
                        })
                    }
                </div>
            </div>
        </main>
        <Footer className="app-wrapper" />
    </>


}