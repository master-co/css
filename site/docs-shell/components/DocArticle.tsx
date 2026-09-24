
import clsx from 'clsx'

export default function DocArticle(props: any) {
  return (
    <article {...props} className={clsx('flex:1|1|auto w:full min-w:0 pb:2xl pt:5.063rem max-w:breakpoint-sm:has(+aside) p:15x|1.875rem@print pb:20x@sm px:20x@md pr:10x:not(:has(+aside))@md pt:35x@md prose', props.className)} />
  )
}
