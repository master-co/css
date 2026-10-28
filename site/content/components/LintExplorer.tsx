'use client'

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { IconAlertTriangle, IconCircleCheck, IconCircleX, IconInfoCircle } from '@tabler/icons-react'
import { useInView } from 'react-intersection-observer'
import { useMediaQuery } from 'usehooks-ts'
import clsx from 'clsx'
import { useTranslation } from '~/site/docs-shell/contexts/i18n'
import type { HomeCodeWindowProblem } from './home-content'

export interface LintExplorerRule {
  title: string
  body: string
  tag: string
  file: string
  /** What the fix did, for rules that have one. */
  fix?: string
  problem: HomeCodeWindowProblem
}

/** How long each rule stays selected while the explorer plays, and when its fix lands. */
const ruleDuration = 6400
const fixAt = 2600

const problemIcons = {
  error: { Icon: IconCircleX, className: 'home-tone-error' },
  info: { Icon: IconInfoCircle, className: 'home-tone-info' },
  warning: { Icon: IconAlertTriangle, className: 'home-tone-warn' }
}

/**
 * Lint rules as a vertical tab list beside one editor. While in view it steps through the rules,
 * and a rule with a fix shows the problem first, then the fixed source. Choosing a rule stops the tour.
 */
export default function LintExplorer({ footer, rules, windows }: { footer?: ReactNode, rules: LintExplorerRule[], windows: ReactNode[] }) {
  const $ = useTranslation()
  const [active, setActive] = useState(0)
  const [fixed, setFixed] = useState(false)
  const [touring, setTouring] = useState(true)
  const [held, setHeld] = useState(false)
  const elapsedRef = useRef(0)
  const fixedRef = useRef(false)
  const progressRef = useRef<HTMLSpanElement>(null)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const { ref, inView } = useInView({ threshold: 0.35 })
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)', { initializeWithValue: false })
  const rule = rules[active]
  const playing = inView && !reduceMotion && !held

  // Each selection restarts the rule's clock: problem first, then the fix, then the next rule.
  useEffect(() => {
    elapsedRef.current = 0
    fixedRef.current = false
    setFixed(false)
    progressRef.current?.style.setProperty('--home-lint-progress', '0')
  }, [active])

  useEffect(() => {
    if (!playing) return
    let frame = 0
    let last = 0
    const tick = (time: number) => {
      if (last) elapsedRef.current += Math.min(time - last, 100)
      last = time
      const elapsed = elapsedRef.current
      progressRef.current?.style.setProperty('--home-lint-progress', String(Math.min(1, elapsed / ruleDuration)))
      if (!fixedRef.current && rules[active].fix && elapsed >= fixAt) {
        fixedRef.current = true
        setFixed(true)
      }
      if (elapsed >= ruleDuration) {
        if (touring) setActive((index) => (index + 1) % rules.length)
        return
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [active, playing, rules, touring])

  function select(index: number) {
    setTouring(false)
    setActive(index)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const next = { ArrowDown: active + 1, ArrowRight: active + 1, ArrowUp: active - 1, ArrowLeft: active - 1, Home: 0, End: rules.length - 1 }[event.key]
    if (next === undefined) return
    event.preventDefault()
    const index = (next + rules.length) % rules.length
    select(index)
    tabRefs.current[index]?.focus()
  }

  const { Icon, className: iconClassName } = problemIcons[rule.problem.severity]
  const status = fixed
    ? <><IconCircleCheck aria-hidden="true" size={14} stroke={1.75} />{$('Fixed')}</>
    : rule.problem.severity === 'info'
      ? $('Preview')
      : <><Icon aria-hidden="true" size={14} stroke={1.75} />{$('1 problem')}</>

  return (
    <div
      className="home-lint"
      data-touring={touring && !reduceMotion ? '' : undefined}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setHeld(false)
      }}
      onFocus={() => setHeld(true)}
      onPointerEnter={() => setHeld(true)}
      onPointerLeave={() => setHeld(false)}
      ref={ref}>
      <div className="home-lint-aside">
        <div aria-label={$('Lint rules')} aria-orientation="vertical" className="home-lint-rules" role="tablist">
          {rules.map((item, index) => (
            <button
              aria-controls="home-lint-panel"
              aria-selected={index === active}
              className="home-lint-rule"
              id={`home-lint-rule-${index}`}
              key={item.title}
              onClick={() => select(index)}
              onKeyDown={handleKeyDown}
              ref={(node) => {
                tabRefs.current[index] = node
              }}
              role="tab"
              tabIndex={index === active ? 0 : -1}
              type="button">
              <span className="home-lint-rule-head">
                <span className="home-lint-rule-title">{$(item.title)}</span>
                <span className="home-tag">{$(item.tag)}</span>
              </span>
              <span className="home-lint-rule-reveal">
                <span className="home-lint-rule-body"><span className="home-lint-rule-text">{$(item.body)}</span></span>
              </span>
              {index === active && <span aria-hidden="true" className="home-lint-rule-progress" ref={progressRef} />}
            </button>
          ))}
        </div>
        {footer}
      </div>

      <div aria-labelledby={`home-lint-rule-${active}`} className="home-lint-editor" data-fixed={fixed ? '' : undefined} id="home-lint-panel" role="tabpanel">
        <div className="home-composer-bar">
          <span aria-hidden="true" className="display:flex gap-2xs">
            <span className="home-code-window-dot" />
            <span className="home-code-window-dot" />
            <span className="home-code-window-dot" />
          </span>
          <span className="home-composer-tab">{rule.file}</span>
          <span className={clsx('home-composer-status', !fixed && rule.problem.severity === 'warning' && 'home-composer-status-warning', !fixed && rule.problem.severity === 'error' && 'home-composer-status-error', fixed && 'home-composer-status-ok')}>
            {status}
          </span>
        </div>
        <div className="home-lint-code">
          {windows.map((window, index) => (
            <div aria-hidden={index === active ? undefined : 'true'} className="home-lint-window" data-active={index === active ? '' : undefined} key={rules[index].title}>
              {window}
            </div>
          ))}
        </div>
        <div aria-live="polite" className="home-lint-problems">
          <p className="home-annotation">{rule.problem.severity === 'info' ? $('Preview') : $('Problems')}</p>
          <div className="home-lint-problem" key={`${active}-${fixed}`}>
            {fixed
              ? <>
                <IconCircleCheck aria-hidden="true" className="home-code-window-problem-icon home-tone-ok" size={16} stroke={1.75} />
                <div className="home-code-window-problem-content">
                  <p className="home-code-window-problem-message">{rule.fix && $(rule.fix)}</p>
                  <p className="home-code-window-problem-meta">{rule.problem.source} · {$('autofix')}</p>
                </div>
              </>
              : <>
                <Icon aria-hidden="true" className={clsx('home-code-window-problem-icon', iconClassName)} size={16} stroke={1.75} />
                <div className="home-code-window-problem-content">
                  <p className="home-code-window-problem-message">{rule.problem.message}</p>
                  <p className="home-code-window-problem-meta">{rule.problem.source} · {rule.problem.location}</p>
                </div>
              </>}
          </div>
        </div>
      </div>
    </div>
  )
}
