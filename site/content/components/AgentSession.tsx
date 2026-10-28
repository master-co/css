'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { IconAlertTriangle, IconCircleCheck, IconLoader2, IconSparkles, IconTool, IconUser } from '@tabler/icons-react'
import { useInView } from 'react-intersection-observer'
import { useMediaQuery } from 'usehooks-ts'
import clsx from 'clsx'
import { useTranslation } from '~/site/docs-shell/contexts/i18n'
import type { HomeCodeWindowProblem } from './home-content'

/** Each step's duration in milliseconds; the last step holds the finished session. */
const steps = [600, 1200, 1400, 1100, 1600, 1600, 1000, 2800, 900, 4600]
const finalStep = steps.length - 1

interface ToolCall {
  name: string
  start: number
  result: string
  tone: 'ok' | 'warning'
}

/** An agent session that lints its draft through the Master CSS MCP server and applies a reviewed fix preview. */
export default function AgentSession({ code, file, fixedCode, problems }: {
  code: string
  file: string
  fixedCode: string
  problems: HomeCodeWindowProblem[]
}) {
  const $ = useTranslation()
  const [step, setStep] = useState(finalStep)
  const { ref, inView } = useInView({ threshold: 0.3 })
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)', { initializeWithValue: false })

  useEffect(() => {
    if (!inView || reduceMotion) return
    const timeout = setTimeout(() => setStep((current) => (current + 1) % steps.length), steps[step])
    return () => clearTimeout(timeout)
  }, [inView, reduceMotion, step])

  const tools: ToolCall[] = [
    { name: 'mastercss_lint_project', start: 3, result: $('4 problems, all fixable'), tone: 'warning' },
    { name: 'mastercss_preview_fixes', start: 6, result: $('Diff ready with a confirmation token'), tone: 'ok' },
    { name: 'mastercss_apply_preview', start: 8, result: $('Applied after the file hash check'), tone: 'ok' }
  ]
  const before = code.trim().split('\n')
  const after = fixedCode.trim().split('\n')
  const view = step >= 9 ? 'applied' : step >= 7 ? 'diff' : step >= 4 ? 'problems' : 'draft'
  const problemLines = new Set(problems.map((problem) => Number(problem.location.split(':')[1])))

  return (
    <div className="home-agent" ref={ref}>
      <div className="home-agent-chat">
        <p className="home-composer-panel-label">{$('Agent session')}</p>
        <Message icon={<IconUser size={14} stroke={1.75} />} show={step >= 1} tone="user">
          {$('Restyle the plan card with our spacing and color tokens.')}
        </Message>
        <Message icon={<IconSparkles size={14} stroke={1.75} />} show={step >= 2} tone="agent">
          {$('I wrote a draft. Next I will lint it and preview fixes with the Master CSS MCP server.')}
        </Message>
        <ol className="display:grid gap-xs mt-sm">
          {tools.map((tool) => {
            const running = step === tool.start
            const finished = step > tool.start
            return (
              <li className={clsx('home-agent-tool', (running || finished) && 'home-agent-tool-shown')} key={tool.name}>
                <span className="home-agent-tool-icon">
                  {running
                    ? <IconLoader2 aria-hidden="true" className="home-spin" size={14} stroke={2} />
                    : finished && tool.tone === 'warning'
                      ? <IconAlertTriangle aria-hidden="true" className="home-tone-warn" size={14} stroke={2} />
                      : finished
                        ? <IconCircleCheck aria-hidden="true" className="home-tone-ok" size={14} stroke={2} />
                        : <IconTool aria-hidden="true" size={14} stroke={1.75} />}
                </span>
                <span className="min-width:0">
                  <code className="display:block overflow:hidden font-xs text-overflow:ellipsis white-space:nowrap fg-text-strong">{tool.name}</code>
                  <span className="display:block font-2xs fg-text-muted">{finished ? tool.result : running ? $('Running…') : ''}</span>
                </span>
              </li>
            )
          })}
        </ol>
        <Message icon={<IconSparkles size={14} stroke={1.75} />} show={step >= 9} tone="agent">
          {$('Applied the preview. The plan card now passes lint with no problems.')}
        </Message>
      </div>

      <div className="home-agent-editor">
        <div className="home-composer-bar">
          <span aria-hidden="true" className="display:flex gap-2xs">
            <span className="home-code-window-dot" />
            <span className="home-code-window-dot" />
            <span className="home-code-window-dot" />
          </span>
          <span className="home-composer-tab">{file}</span>
          <span className={clsx('home-composer-status', view === 'problems' && 'home-composer-status-warning', view === 'applied' && 'home-composer-status-ok')}>
            {view === 'problems'
              ? <><IconAlertTriangle aria-hidden="true" size={14} stroke={1.75} />{$('{count} problems').replace('{count}', String(problems.length))}</>
              : view === 'diff'
                ? $('Preview')
                : view === 'applied'
                  ? <><IconCircleCheck aria-hidden="true" size={14} stroke={1.75} />{$('No problems')}</>
                  : $('Draft')}
          </span>
        </div>
        <div className="home-agent-code">
          {view === 'diff'
            ? before.map((line, index) => line === after[index]
              ? <CodeLine key={index} line={line} />
              : [<CodeLine key={`-${index}`} line={line} mark="removed" />, <CodeLine key={`+${index}`} line={after[index]} mark="added" />])
            : (view === 'applied' ? after : before).map((line, index) => (
              <CodeLine key={`${view}-${index}`} line={line} mark={view === 'problems' && problemLines.has(index + 1) ? 'problem' : view === 'applied' && line !== before[index] ? 'fixed' : undefined} />
            ))}
        </div>
        <div className="home-agent-problems">
          <p className="home-agent-problems-header">
            {$('Problems')}
            <span className="home-agent-problems-count">{view === 'problems' || view === 'diff' ? problems.length : 0}</span>
          </p>
          {view === 'problems' || view === 'diff'
            ? (
              <div className={clsx('home-agent-problems-list', view === 'diff' && 'home-agent-problems-list-fixing')}>
                {problems.map((problem) => (
                  <div className="home-code-window-problem" key={problem.location}>
                    <IconAlertTriangle aria-hidden="true" className="home-agent-problem-icon home-code-window-problem-icon" size={16} stroke={1.75} />
                    <div className="home-code-window-problem-content">
                      <p className="home-code-window-problem-message">{problem.message}</p>
                      <p className="home-code-window-problem-meta">{problem.source} - {problem.location}</p>
                    </div>
                  </div>
                ))}
              </div>
            )
            : (
              <p className="home-agent-problems-empty">
                {view === 'applied' && <IconCircleCheck aria-hidden="true" size={14} stroke={1.75} />}
                {view === 'applied' ? $('No problems') : $('Not linted yet')}
              </p>
            )}
        </div>
      </div>
    </div>
  )
}

function Message({ children, icon, show, tone }: { children: ReactNode, icon: ReactNode, show: boolean, tone: 'agent' | 'user' }) {
  return (
    <div className={clsx('home-agent-message', `home-agent-message-${tone}`, show && 'home-agent-message-shown')}>
      <span aria-hidden="true" className="home-agent-avatar">{icon}</span>
      <p className="min-width:0">{children}</p>
    </div>
  )
}

/** One line of markup, highlighted by hand so diagnostics can mark its class value. */
function CodeLine({ line, mark }: { line: string, mark?: 'added' | 'fixed' | 'problem' | 'removed' }) {
  const match = line.match(/^(\s*)<(\w+) class="([^"]*)">(.*)$/)
  return (
    <div className={clsx('home-agent-line', mark && `home-agent-line-${mark}`)}>
      <span aria-hidden="true" className="home-agent-line-sign">{mark === 'added' ? '+' : mark === 'removed' ? '-' : ''}</span>
      {match
        ? <span>
          {match[1]}<span className="home-code-tag">&lt;{match[2]}</span> <span className="home-code-attr">class</span>=<span className="home-code-string">&quot;<span className="home-agent-classes">{match[3]}</span>&quot;</span><span className="home-code-tag">&gt;</span>{match[4].replace(/<\/(\w+)>$/, '')}{/<\/\w+>$/.test(match[4]) && <span className="home-code-tag">{match[4].match(/<\/\w+>$/)![0]}</span>}
        </span>
        : <span className="home-code-tag">{line}</span>}
    </div>
  )
}
