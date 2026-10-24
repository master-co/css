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
  showControls?: boolean
  copyable?: boolean
  children: string
}

/** Render a prepared code tree without loading the highlighting pipeline. */
/** Copy controls read the rendered Shiki lines; see `docs-shell/scripts/code`. */
export default function CodeView(props: CodeProp & HTMLAttributes<HTMLDivElement> & { code: ReactNode }) {
  const { lang, className, name, tabbarClassName, showControls, copyable = true, code } = props
  return (
    <div className={clsx('code', { 'code-plain': !name && copyable }, className)}>
      {name && <CodeTabBar tabs={[{ name, lang, ext: props.ext }]} currentName={name} className={tabbarClassName} showControls={showControls} copyable={copyable} />}
      {!name && copyable && <CodeCopyButton className="code-copy-corner" />}
      {code}
    </div>
  )
}

export function PreparedCodeView({ prepared, ...props }: CodeProp & HTMLAttributes<HTMLDivElement> & { prepared: PreparedCode }) {
  return <CodeView {...props} code={<pre {...prepared.properties} dangerouslySetInnerHTML={{ __html: prepared.html }} />} />
}
