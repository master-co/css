import '~/site/styles/docs-shell/prose.css'
import { isValidElement, type ReactNode } from 'react'
import { IconHash } from '@tabler/icons-react'
import Link from './Link'
import resolvingHeading from '../utils/resolve-heading'

/** The visible text of heading children such as `<StepNum />Add Master CSS` or inline code. */
function textOf(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(textOf).join('')
  return isValidElement<{ children?: ReactNode }>(node) ? textOf(node.props.children) : ''
}

/** Clicking a heading copies its link; see `docs-shell/scripts/document`. */
export default function DocHeading({ tagName, ...props }: any) {
  const Element = tagName === 'h2' ? 'h2' : 'h3'
  const heading = resolvingHeading(props.children, props.id)
  return (
    <Element {...props} {...heading} title={typeof heading.title === 'string' ? heading.title : textOf(props.children).trim() || undefined} data-doc-heading="">
      <IconHash className="position:absolute inset:0 margin-block:auto margin-left:-1.375em stroke-text-muted contain:strict doc-heading-icon" width={'1em'} height={'1em'} />
      <Link href={'#' + props.id} className="content:none:after">
        {typeof props.children === 'string' ? props.children.replace(' [sr-only]', '') : props.children}
      </Link>
    </Element>
  )
}
