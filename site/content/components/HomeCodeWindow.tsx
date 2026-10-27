import { IconAlertTriangle, IconCircleX, IconInfoCircle } from '@tabler/icons-react'
import clsx from 'clsx'
import Code, { type CodeProp } from '~/site/docs-shell/components/Code'
import type { HomeCodeWindowProblem, HomeCodeWindowProblemSeverity } from './home-content'

const windowDots = ['close', 'minimize', 'zoom'] as const

const problemIcons = {
  error: { Icon: IconCircleX, className: 'fg-text-red' },
  info: { Icon: IconInfoCircle, className: 'fg-text-blue' },
  warning: { Icon: IconAlertTriangle, className: 'fg-text-amber' }
} satisfies Record<HomeCodeWindowProblemSeverity, { Icon: typeof IconCircleX, className: string }>

export interface HomeCodeWindowProps {
  children: string
  className?: string
  fixPreviewCode?: string
  lang: CodeProp['lang']
  masterCSS?: CodeProp['masterCSS']
  preClassName?: string
  problems?: readonly HomeCodeWindowProblem[]
  problemsLabel?: string
  variant?: 'framed' | 'embedded'
}

/** A decorative editor window around highlighted code, optionally with a problems panel. */
export default function HomeCodeWindow({
  children,
  className,
  fixPreviewCode,
  lang,
  masterCSS,
  preClassName,
  problems,
  problemsLabel,
  variant = 'framed'
}: HomeCodeWindowProps) {
  const codePreClassName = clsx('home-code-window-pre', preClassName)
  return (
    <div className={clsx('home-code-window', fixPreviewCode && 'home-code-window-has-fix', variant === 'framed' && 'home-code-window-framed', className)}>
      <div aria-hidden="true" className="home-code-window-chrome">
        {windowDots.map((dot) => <span className="home-code-window-dot" key={dot} />)}
      </div>
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
      {problems?.length ? (
        <div className="home-code-window-problems">
          <div className="home-code-window-problems-bar">
            <p className="home-code-window-problems-label">{problemsLabel}</p>
            <span className="home-code-window-problems-count">{problems.length}</span>
          </div>
          <div className="home-code-window-problems-list">
            {problems.map((problem) => {
              const { Icon, className: iconClassName } = problemIcons[problem.severity]
              return (
                <div className="home-code-window-problem" key={problem.message}>
                  <Icon aria-hidden="true" className={clsx('home-code-window-problem-icon', iconClassName)} size={16} stroke={1.75} />
                  <div className="home-code-window-problem-content">
                    <p className="home-code-window-problem-message">{problem.message}</p>
                    <p className="home-code-window-problem-meta">{problem.source} - {problem.location}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}
