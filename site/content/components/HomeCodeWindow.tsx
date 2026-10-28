import clsx from 'clsx'
import Code, { type CodeProp } from '~/site/docs-shell/components/Code'

export interface HomeCodeWindowProps {
  children: string
  className?: string
  fixPreviewCode?: string
  lang: CodeProp['lang']
  masterCSS?: CodeProp['masterCSS']
  preClassName?: string
}

/** Highlighted code in a well; with `fixPreviewCode`, the fixed source sits on a second layer that hover or a parent state reveals. */
export default function HomeCodeWindow({ children, className, fixPreviewCode, lang, masterCSS, preClassName }: HomeCodeWindowProps) {
  const codePreClassName = clsx('home-code-window-pre', preClassName)
  return (
    <div className={clsx('home-code-window', fixPreviewCode && 'home-code-window-has-fix', className)}>
      {fixPreviewCode ? (
        <div className="home-code-window-stack">
          <div className="home-code-window-layer home-code-window-source">
            <Code copyable={false} lang={lang} masterCSS={masterCSS} preClassName={codePreClassName}>{children}</Code>
          </div>
          <div aria-hidden="true" className="home-code-window-fix home-code-window-layer">
            <Code copyable={false} lang={lang} masterCSS={masterCSS} preClassName={codePreClassName}>{fixPreviewCode}</Code>
          </div>
        </div>
      ) : (
        <Code className="home-code-window-body" copyable={false} lang={lang} masterCSS={masterCSS} preClassName={codePreClassName}>
          {children}
        </Code>
      )}
    </div>
  )
}
