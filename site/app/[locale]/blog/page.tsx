import Footer from 'internal/components/Footer'
import pageCategories from 'site/.categories/blog.json'
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
        <div className="flex align-items:center my:1x pl:1x">
            {children.map((eachAuthor: any, index: number) => {
                const author = authors.find((x: any) => x.name === eachAuthor.name)
                if (!author) return null
                return (
                    <Image
                        key={author.name}
                        className={clsx('round object:cover outline:2|canvas', {
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
        <main className='px:5x pt:12x pt:15x@sm'>
            <div className="mx:auto my:18x max-w:5xl prose my:30x@sm">
                <div className='bl:1|muted bt:1|muted grid-cols:1 grid-cols:2@sm grid-cols:3@md'>
                    {pages
                        .map((page: any, index: number) => {
                            const formattedDate = dayjs(page.date).format('ddd, MMMM D')
                            return (
                                <div key={page.pathname + index} className={clsx('bb:1|dotted|muted br:1|dotted|muted')}>
                                    <Link href={page.pathname} className={clsx('transition:background-color|.2s gap:5x p:6x flex flex-col h:full bg:surface:hover p:12x@sm')}>
                                        <div className="flex justify-content:space-between mb:-1x">
                                            <div className='text:12 fg:accent'>{formattedDate}</div>
                                            <div className='text:12 fg:muted'> <TimeAgo timestamp={page.date} /></div>
                                        </div>
                                        <div className='text:pretty my:-1x font:20 leading:1.4'>{page.title}</div>
                                        {/* <Image src="/images/gold-pattern.jpg"  className="r:5 aspect:16/9 h:auto" width={480} height={270} alt={page.title} /> */}
                                        <div className='text:pretty text:12 fg:text mt:auto'>{page.description}</div>
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
