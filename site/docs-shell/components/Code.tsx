

import { HTMLAttributes } from 'react'
import clsx from 'clsx'
import { toJsxRuntime } from 'hast-util-to-jsx-runtime'
import { Fragment, jsxs, jsx } from 'react/jsx-runtime'
import type { MasterCSSShikiOptions } from '@master/css-language-service/shiki'
import highlightCode from '../utils/highlight-code'
import CodeTabBar from './CodeTabBar'

export declare interface CodeProp {
  name?: string
  lang: string
  ext?: string
  beautify?: boolean
  dedent?: boolean | 'block'
  type?: string
  number?: boolean
  preClassName?: string
  masterCSS?: MasterCSSShikiOptions
  tabbarClassName?: string
  showControls?: boolean
  children: string
}

export default async function Code(props: CodeProp & HTMLAttributes<HTMLDivElement>) {
  const { lang, className, name, children, preClassName, tabbarClassName, showControls } = props
  const hast = await highlightCode(children, {
    lang,
    beautify: !!props.beautify,
    dedent: props.dedent,
    className: preClassName,
    masterCSS: props.masterCSS
  })
  return (
    <div className={clsx('code', className)}>
      {name && <CodeTabBar tabs={[props]} currentName={name} currentCode={children} className={tabbarClassName} showControls={showControls} />}
      {toJsxRuntime(hast, { Fragment, jsxs, jsx })}
    </div>
  )
}
