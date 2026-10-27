import type { HTMLAttributes } from 'react'
import { toJsxRuntime } from 'hast-util-to-jsx-runtime'
import { Fragment, jsxs, jsx } from 'react/jsx-runtime'
import highlightCode from '../utils/highlight-code'
import CodeView, { type CodeProp } from './CodeView'

export type { CodeProp } from './CodeView'

export default async function Code(props: CodeProp & HTMLAttributes<HTMLDivElement>) {
  const hast = await highlightCode(props.children, {
    lang: props.lang,
    beautify: !!props.beautify,
    dedent: props.dedent,
    className: props.preClassName,
    masterCSS: props.masterCSS
  })
  return <CodeView {...props} code={toJsxRuntime(hast, { Fragment, jsxs, jsx })} />
}
