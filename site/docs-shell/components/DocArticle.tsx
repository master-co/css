import '~/site/styles/docs-shell/demo.css'
import '~/site/styles/docs-shell/docs.css'
import '~/site/styles/docs-shell/prose.css'

import clsx from 'clsx'

export default function DocArticle(props: any) {
  return (
    <article {...props} className={clsx('flex:1|1|auto width:100% min-width:0 pb-2xl padding-top:5.063rem max-width:52.125rem:has(+aside) padding:3.75rem|1.875rem@media(print) padding-bottom:5rem@sm padding-inline:5rem@md padding-right:2.5rem:not(:has(+aside))@md padding-top:8.75rem@md prose', props.className)} />
  )
}
