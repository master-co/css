import '~/site/styles/docs-shell/code.css'


import { toJsxRuntime } from 'hast-util-to-jsx-runtime'
import highlightCode from '../utils/highlight-code'
import CodeTabsView from './CodeTabsView'
import { Fragment, jsxs, jsx } from 'react/jsx-runtime'
import type { ReactNode } from 'react'

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
  highlightedCode?: ReactNode
}

export default async function CodeTabs({ children, ...props }: { children: CodeTab[], showControls?: boolean, className?: string, localStorageKey?: string }) {
  return (
    <CodeTabsView {...props}>{
      await Promise.all(
        children.map(async (child) => {
          const hast = await highlightCode(child.code, child)
          return {
            ...child,
            name: child.name ?? child.lang,
            highlightedCode: toJsxRuntime(hast, { Fragment, jsxs, jsx })
          }
        })
      )
    }</CodeTabsView>
  )
}
