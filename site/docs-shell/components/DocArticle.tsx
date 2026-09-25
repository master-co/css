import '~/site/styles/docs-shell/demo.css'
import '~/site/styles/docs-shell/docs.css'
import '~/site/styles/docs-shell/prose.css'

import clsx from 'clsx'

export default function DocArticle(props: any) {
  return (
    <article {...props} className={clsx('flex:1|1|auto w:100% min-w:0 pb-2xl pt:5.063rem max-w:var(--breakpoint-sm):has(+aside) p:3.75rem|1.875rem@print pb:5rem@sm px:5rem@md pr:2.5rem:not(:has(+aside))@md pt:8.75rem@md prose', props.className)} />
  )
}
