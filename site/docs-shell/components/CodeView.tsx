import '~/site/styles/docs-shell/code.css'

import type { HTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'
import type { PreparedCode } from '../utils/prepared-code'
import type { MasterCSSShikiOptions } from '@master/css-language-service/shiki'
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
  /** Accepted for older callers; the bar names the file and nothing else. */
  showControls?: boolean
  copyable?: boolean
  children: string
}

/**
 * A `ui-code` panel without loading the highlighting pipeline: a bar naming the file when it has a `name`, otherwise a
 * copy button in the corner. Copy controls read the rendered Shiki lines; see `docs-shell/scripts/code`.
 */
export default function CodeView(props: CodeProp & HTMLAttributes<HTMLDivElement> & { code: ReactNode }) {
  const { lang, className, name, tabbarClassName, copyable = true, number, code } = props
  return (
    <div className={clsx('ui-code', className)} data-numbers={number ? '' : undefined}>
      {name && <CodeTabBar tabs={[{ name, lang, ext: props.ext }]} currentName={name} className={tabbarClassName} copyable={copyable} />}
      {!name && copyable && <CodeCopyButton />}
      {code}
    </div>
  )
}

export function PreparedCodeView({ prepared, ...props }: CodeProp & HTMLAttributes<HTMLDivElement> & { prepared: PreparedCode }) {
  return <CodeView {...props} code={<pre {...prepared.properties} dangerouslySetInnerHTML={{ __html: prepared.html }} />} />
}
