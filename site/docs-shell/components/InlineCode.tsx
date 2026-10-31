import highlightCode from '../utils/highlight-code'
import { toJsxRuntime } from 'hast-util-to-jsx-runtime'
import { Fragment, jsxs, jsx } from 'react/jsx-runtime'

export default async function InlineCode({ children, ...props }: any) {
  const hast: any = await highlightCode(children, {
    inline: true,
    ...props
  })
  // A single token (no spaces) is marked, so reading text can keep it whole rather than split it at a hyphen.
  const code = hast.children?.[0]
  if (code?.type === 'element' && typeof children === 'string' && !/\s/.test(children.trim())) {
    code.properties = { ...code.properties, dataToken: '' }
  }
  return toJsxRuntime(hast as any, { Fragment, jsxs, jsx })
}
