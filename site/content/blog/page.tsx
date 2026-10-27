import '~/site/styles/docs-shell/prose.css'
import Footer from '~/site/docs-shell/components/Footer'
import pageCategories from '~/site/.categories/blog.json'
import { footerProps } from '~/site/navigation'
import Image from '~/site/docs-shell/components/Image'
import clsx from 'clsx'
import dayjs from 'dayjs'
import Link from '~/site/docs-shell/components/Link'
import metadata from './metadata'
import generate from '~/site/docs-shell/utils/generate-metadata'
import dictionaries from '~/site/dictionaries'
import TimeAgo from '~/site/docs-shell/components/TimeAgo'
import authors from '~/site/docs-shell/data/authors'
import { createTranslation } from '~/site/docs-shell/utils/i18n'


export async function generateMetadata(props: any) {
  return await generate(metadata, props, dictionaries)
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
            className={clsx('aspect-ratio:1/1 border-radius:50% outline-color:canvas outline-style:solid outline-width:2px object-fit:cover', {
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
  const { locale } = props.params
  const $ = await createTranslation(locale, dictionaries)
  const pages = pageCategories
    .map(({ pages }) => pages)
    .flat()
    .sort((a: any, b: any) => Date.parse(b.date) - Date.parse(a.date))

  return <>
    <main className='pt-2xl padding-inline:1.25rem padding-top:3.75rem@sm'>
      <div className="max-w-5xl margin-block:4.5rem margin-inline:auto margin-block:7.5rem@sm prose">
        {/* Posts sit as raised sheets in a recessed shell, 8px apart, like the reference index. */}
        <div className='grid-cols(1) gap-xs p-xs r-3xl bg-surface-shell box-shadow:inset|0|0|0|1px|var(--color-line-subtle) grid-cols(2)@sm grid-cols(3)@md'>
          {pages
            .map((page: any, index: number) => {
              const formattedDate = dayjs(page.date).format('ddd, MMMM D')
              return (
                <div key={page.pathname + index}>
                  <Link href={page.pathname} className="display:flex flex-direction:column gap:1.25rem height:100% p-lg r-2xl bg-surface-raised shadow-raised transition-duration:0.2s transition-property:background-color bg-surface-base:hover p-2xl@sm">
                    <div className="display:flex align-items:baseline justify-content:space-between margin-bottom:-0.25rem">
                      <div className='font-mono font-2xs letter-spacing:.08em fg-text-muted'>{formattedDate}</div>
                      <div className='text-xs fg-text-muted'> <TimeAgo timestamp={page.date} /></div>
                    </div>
                    <div className='margin-block:-0.25rem font-xl leading-sm text-wrap:pretty'>{$(page.title)}</div>
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
