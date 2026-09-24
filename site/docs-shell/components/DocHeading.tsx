'use client'

import { IconHash } from '@tabler/icons-react'
import { snackbar } from '../utils/snackbar'
import Link from './Link'
import resolvingHeading from '../utils/resolve-heading'

export default function DocHeading({ tagName, ...props }: any) {
  const Element = tagName === 'h2' ? 'h2' : 'h3'
  return (
    <Element {...props} {...resolvingHeading(props.children, props.id)} onClick={() => {
      const link = location.origin + location.pathname + '#' + props.id
      snackbar('Link copied <b>' + link + '</b>')
      navigator.clipboard.writeText(link)
    }}>
      { }
      <IconHash className="abs inset:0 invisible my:auto ml:-1.375em stroke-text-disabled contain:strict visible:of(:target)" width={'1em'} height={'1em'} />
      <Link href={'#' + props.id} className="content:none:after text:inherit">
        {typeof props.children === 'string' ? props.children.replace(' [sr-only]', '') : props.children}
      </Link>
    </Element>
  )
}