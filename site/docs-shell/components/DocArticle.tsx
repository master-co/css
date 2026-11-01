import '~/site/styles/docs-shell/docs.css'
import '~/site/styles/docs-shell/prose.css'
import clsx from 'clsx'

/** The article column; with `aside` it narrows to leave room for the page's contents rail. */
export default function DocArticle({ aside, className, ...props }: any) {
  return <article {...props} className={clsx('ui-docs-article ui-prose', className)} data-aside={aside ? '' : undefined} />
}
