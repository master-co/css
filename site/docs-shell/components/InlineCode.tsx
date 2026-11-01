import clsx from 'clsx'
import highlightCode from '../utils/highlight-code'
import { toJsxRuntime } from 'hast-util-to-jsx-runtime'
import { Fragment, jsxs, jsx } from 'react/jsx-runtime'

/** Highlighted inline code, drawn as a `ui-inline-code` chip. */
export default async function InlineCode({ children, className, ...props }: any) {
  const hast: any = await highlightCode(children, {
    inline: true,
    ...props,
    className: clsx('ui-inline-code', className)
  })
  // A single token (no spaces) is marked, so reading text can keep it whole rather than split it at a hyphen.
  const code = hast.children?.[0]
  if (code?.type === 'element' && typeof children === 'string' && !/\s/.test(children.trim())) {
    code.properties = { ...code.properties, dataToken: '' }
  }
  return toJsxRuntime(hast as any, { Fragment, jsxs, jsx })
}
