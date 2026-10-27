import type { Root } from 'hast'
import type { HTMLAttributes, ReactElement } from 'react'
import { Fragment, jsxs, jsx } from 'react/jsx-runtime'
import { toJsxRuntime } from 'hast-util-to-jsx-runtime'
import highlightedCodeText from './highlighted-code-text'

export interface PreparedCode {
  properties: HTMLAttributes<HTMLPreElement>
  html: string
  text: string
}

/** Store trusted Shiki HTML without its per-token React rendering cost. */
export async function prepareCode(tree: Root): Promise<PreparedCode> {
  const pre = tree.children[0]
  if (pre?.type !== 'element' || pre.tagName !== 'pre' || tree.children.length !== 1) {
    throw new Error('Expected one highlighted code block')
  }
  const { hastToHtml } = await import('shiki/core')
  const element = toJsxRuntime({ ...pre, children: [] }, { Fragment, jsxs, jsx }) as ReactElement<HTMLAttributes<HTMLPreElement>>
  const { children: _children, ...properties } = element.props
  return {
    properties,
    html: hastToHtml({ type: 'root', children: pre.children }),
    text: highlightedCodeText(tree)
  }
}
