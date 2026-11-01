import '~/site/styles/docs-shell/prose.css'
import { isValidElement, type ReactNode } from 'react'
import resolvingHeading from '../utils/resolve-heading'

/** The visible text of heading children such as `Add Master CSS` or inline code. */
function textOf(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(textOf).join('')
  return isValidElement<{ children?: ReactNode }>(node) ? textOf(node.props.children) : ''
}

/** A section heading with its `ui-anchor`. Clicking a heading copies its link; see `docs-shell/scripts/document`. */
export default function DocHeading({ tagName, ...props }: any) {
  const Element = tagName === 'h2' ? 'h2' : 'h3'
  const heading = resolvingHeading(props.children, props.id)
  const text = textOf(props.children).trim()
  return (
    <Element {...props} {...heading} title={typeof heading.title === 'string' ? heading.title : text || undefined} data-doc-heading="">
      <a className="ui-anchor" href={'#' + (heading.id ?? props.id)} aria-label={`Link to section: ${typeof heading.title === 'string' ? heading.title : text}`}>#</a>
      {typeof props.children === 'string' ? props.children.replace(' [sr-only]', '') : props.children}
    </Element>
  )
}
