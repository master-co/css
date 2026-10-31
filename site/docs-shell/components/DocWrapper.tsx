import '~/site/styles/docs-shell/wrapper.css'
import clsx from 'clsx'

export default function DocWrapper(props: any) {
  return (
    <div {...props} className={clsx('flex w-full app-wrapper', props.className)}>
      {props.children}
    </div>
  )
}
