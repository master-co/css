

import { toJsxRuntime } from 'hast-util-to-jsx-runtime'
import highlightCode from '../utils/highlight-code'
import CodeTabsClient from './CodeTabsClient'
import { Fragment, jsxs, jsx } from 'react/jsx-runtime'

export declare interface CodeTab {
  name?: string
  lang: string
  ext?: string
  beautify?: boolean
  dedent?: boolean | 'block'
  type?: string
  number?: boolean
  showControls?: boolean
  code: string
  highlightedCode?: any
}

export default async function CodeTabs({ children, ...props }: { children: CodeTab[], showControls?: boolean, className?: string, localStorageKey?: string }) {
  return (
    <CodeTabsClient {...props}>{
      await Promise.all(
        children.map(async (child) => {
          return {
            ...child,
            highlightedCode: toJsxRuntime(await highlightCode(child.code, child), { Fragment, jsxs, jsx })
          }
        })
      )
    }</CodeTabsClient>
  )
}
