import Footer from 'internal/components/Footer'
import pageCategories from '~/site/.categories/blog.json'
import Image from 'next/image'
import clsx from 'clsx'
import dayjs from 'dayjs'
import Link from 'internal/components/Link'
import metadata from './metadata'
import generate from 'internal/utils/generate-metadata'
import dictionaries from '~/site/dictionaries'
import TimeAgo from 'internal/components/TimeAgo'
import authors from 'internal/data/authors'

export const dynamic = 'force-static'
export const revalidate = false

export async function generateMetadata(props: any, parent: any) {
    return await generate(metadata, props, dictionaries, parent)
}

function AuthorAvatarStack({ children }: { children: any[] }) {
    return (
        <div className="flex items-center my:3xs pl:3xs">
            {children.map((eachAuthor: any, index: number) => {
                const author = authors.find((x: any) => x.name === eachAuthor.name)
                if (!author) return null
                return (
                    <Image
                        key={author.name}
                        className={clsx('round outline:2px|solid|canvas object-cover', {
                            'ml:-1x': index > 0
                        })}
                        src={author.image}
                        width={20}
                        height={20}
                        alt={author.name}
                    />
                )
            })}
        </div>
    )
}

export default async function Page(props: any) {
    const { locale } = await props.params
    const pages = pageCategories
        .map(({ pages }) => pages)
        .flat()
        .sort((a: any, b: any) => Date.parse(b.date) - Date.parse(a.date))

    return <>
        <main className='px:5x pt:2xl pt:15x@sm'>
            <div className="prose max-w:5xl mx:auto my:18x my:30x@sm">
                <div className='grid-cols:1 bl:1px|solid|muted bt:1px|solid|muted grid-cols:2@sm grid-cols:3@md'>
                    {pages
                        .map((page: any, index: number) => {
                            const formattedDate = dayjs(page.date).format('ddd, MMMM D')
                            return (
                                <div key={page.pathname + index} className={clsx('bb:1px|dotted|muted br:1px|dotted|muted')}>
                                    <Link href={page.pathname} className={clsx('flex flex-col gap:5x h:full p:lg transition:background-color|.2s surface:base:hover p:2xl@sm')}>
                                        <div className="flex justify-between mb:-1x">
                                            <div className='text:xs fg:accent'>{formattedDate}</div>
                                            <div className='text:xs text:muted'> <TimeAgo timestamp={page.date} /></div>
                                        </div>
                                        <div className='my:-1x font:xl leading:sm text-pretty'>{page.title}</div>
                                        {/* <Image src="/images/gold-pattern.jpg"  className="r:5px aspect-ratio:16/9 h:auto" width={480} height={270} alt={page.title} /> */}
                                        <div className='mt:auto text:xs text-pretty fg:text'>{page.description}</div>
                                        <AuthorAvatarStack>{page.authors}</AuthorAvatarStack>
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
