import '~/site/styles/docs-shell/code.css'


import { HTMLAttributes } from 'react'
import clsx from 'clsx'
import { toJsxRuntime } from 'hast-util-to-jsx-runtime'
import { Fragment, jsxs, jsx } from 'react/jsx-runtime'
import type { MasterCSSShikiOptions } from '@master/css-language-service/shiki'
import highlightCode from '../utils/highlight-code'
import highlightedCodeText from '../utils/highlighted-code-text'
import CodeTabBar from './CodeTabBar'
import CodeCopyButton from './CodeCopyButton'

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
  copyable?: boolean
  children: string
}

export default async function Code(props: CodeProp & HTMLAttributes<HTMLDivElement>) {
  const { lang, className, name, children, preClassName, tabbarClassName, showControls, copyable = true } = props
  const hast = await highlightCode(children, {
    lang,
    beautify: !!props.beautify,
    dedent: props.dedent,
    className: preClassName,
    masterCSS: props.masterCSS
  })
  const copyText = highlightedCodeText(hast)
  return (
    <div className={clsx('code', { 'code-plain': !name && copyable }, className)}>
      {name && <CodeTabBar tabs={[{ name, lang, ext: props.ext }]} currentName={name} copyText={copyText} className={tabbarClassName} showControls={showControls} copyable={copyable} />}
      {!name && copyable && <CodeCopyButton text={copyText} className="code-copy-corner" />}
      {toJsxRuntime(hast, { Fragment, jsxs, jsx })}
    </div>
  )
}
