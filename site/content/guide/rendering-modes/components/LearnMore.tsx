import Link from '~/site/docs-shell/components/Link'
import clsx from 'clsx'

export default (props: any) => {
  return (
    <Link {...props} className={clsx(`flex items-center justify-center (height:2.75rem) my-sm px-md r-md font-sm font-medium (text-decoration:none)!`, {
      '(border-width:1px) bg-primary b-black/.1@apply(--site-light) b-white/.2@apply(--site-dark) fg-black:hover text-primary': !props.disabled
    })}>
      {props.children}
    </Link>
  )
}
