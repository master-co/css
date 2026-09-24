

import highlightCode from '../utils/highlight-code'
import { toJsxRuntime } from 'hast-util-to-jsx-runtime'
import { Fragment, jsxs, jsx } from 'react/jsx-runtime'

export default async function InlineCode({ children, ...props }: any) {
  const hast = await highlightCode(children, {
    inline: true,
    ...props
  })
  return toJsxRuntime(hast as any, { Fragment, jsxs, jsx })
}
