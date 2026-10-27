import '~/site/styles/docs-shell/docs.css'
import '~/site/styles/docs-shell/prose.css'

import clsx from 'clsx'

/** `aside` reserves room for the page contents rail, which renders inside a client island. */
export default function DocArticle({ aside, ...props }: any) {
  return (
    <article {...props} className={clsx('flex-grow:1 flex-shrink:1 flex-basis:auto width:100% min-width:0 pb-2xl padding-top:5.063rem padding-top:3.75rem@media(print) padding-right:1.875rem@media(print) padding-bottom:3.75rem@media(print) padding-left:1.875rem@media(print) padding-bottom:5rem@sm padding-left:5rem@md padding-top:8.75rem@md prose', aside ? 'max-width:52.125rem padding-right:5rem@md' : 'padding-right:2.5rem@md', props.className)} />
  )
}
