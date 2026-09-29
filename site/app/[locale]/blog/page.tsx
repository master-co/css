import Footer from '~/site/docs-shell/components/Footer'
import pageCategories from '~/site/.categories/blog.json'
import { footerProps } from '~/site/navigation'
import Image from 'next/image'
import clsx from 'clsx'
import dayjs from 'dayjs'
import Link from '~/site/docs-shell/components/Link'
import metadata from './metadata'
import generate from '~/site/docs-shell/utils/generate-metadata'
import dictionaries from '~/site/dictionaries'
import TimeAgo from '~/site/docs-shell/components/TimeAgo'
import authors from '~/site/docs-shell/data/authors'
import { createTranslation } from '~/site/docs-shell/utils/i18n'

export const dynamic = 'force-static'
export const revalidate = false

export async function generateMetadata(props: any, parent: any) {
  return await generate(metadata, props, dictionaries, parent)
}

function AuthorAvatarStack({ children }: { children: any[] }) {
  return (
    <div className="display:flex align-items:center my-3xs pl-3xs">
      {children.map((eachAuthor: any, index: number) => {
        const author = authors.find((x: any) => x.name === eachAuthor.name)
        if (!author) return null
        return (
          <Image
            key={author.name}
            className={clsx('aspect-ratio:1/1 border-radius:50% outline-width:2px outline-style:solid outline-color:canvas object-fit:cover', {
              'margin-left:-0.25rem': index > 0
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
  const $ = await createTranslation(locale, dictionaries)
  const pages = pageCategories
    .map(({ pages }) => pages)
    .flat()
    .sort((a: any, b: any) => Date.parse(b.date) - Date.parse(a.date))

  return <>
    <main className='padding-inline:1.25rem pt-2xl padding-top:3.75rem@sm'>
      <div className="max-w-5xl margin-block:4.5rem margin-inline:auto margin-block:7.5rem@sm prose">
        <div className='grid-cols(1) border-left-width:1px border-left-style:solid bl-line-subtle border-top-width:1px border-top-style:solid bt-line-subtle grid-cols(2)@sm grid-cols(3)@md'>
          {pages
            .map((page: any, index: number) => {
              const formattedDate = dayjs(page.date).format('ddd, MMMM D')
              return (
                <div key={page.pathname + index} className={clsx('border-bottom-width:1px border-bottom-style:dotted bb-line-subtle border-right-width:1px border-right-style:dotted br-line-subtle')}>
                  <Link href={page.pathname} className={clsx('display:flex flex-direction:column gap:1.25rem height:100% p-lg transition-property:background-color transition-duration:0.2s bg-surface-raised:hover p-2xl@sm')}>
                    <div className="display:flex justify-content:space-between margin-bottom:-0.25rem">
                      <div className='text-xs fg-accent'>{formattedDate}</div>
                      <div className='text-xs fg-text-muted'> <TimeAgo timestamp={page.date} /></div>
                    </div>
                    <div className='margin-block:-0.25rem font-size-xl leading-sm text-wrap:pretty'>{$(page.title)}</div>
                    {/* <Image src="/images/gold-pattern.jpg"  className="border-radius:5px aspect-ratio:16/9 height:auto" width={480} height={270} alt={page.title} /> */}
                    <div className='margin-top:auto text-xs text-wrap:pretty fg-text-body'>{$(page.description)}</div>
                    <AuthorAvatarStack>{page.authors}</AuthorAvatarStack>
                  </Link>
                </div>
              )
            })
          }
        </div>
      </div>
    </main>
    <Footer {...footerProps} className="app-wrapper" />
  </>
}
