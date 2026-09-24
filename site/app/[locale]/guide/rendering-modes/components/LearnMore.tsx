import Link from '~/site/docs-shell/components/Link'
import clsx from 'clsx'

export default (props: any) => {
  return (
    <Link {...props} className={clsx(`flex items-center justify-center h:2.75rem my-sm px-md r-md font-medium font-sm text-decoration:none!`, {
      'border-width:1px bg-primary text-primary fg-black:hover b-black/.1@light b-white/.2@dark': !props.disabled
    })}>
      {props.children}
    </Link>
  )
}
