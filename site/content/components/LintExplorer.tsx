'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ComponentType, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react'
import { IconAlertTriangle, IconBrandHtml5, IconBulb, IconCircleCheck, IconCircleX, IconInfoCircle, IconPlugConnected, IconRotateClockwise, IconTerminal2 } from '@tabler/icons-react'
import { useInView } from 'react-intersection-observer'
import { useMediaQuery } from 'usehooks-ts'
import clsx from 'clsx'
import { useTranslation } from '~/site/docs-shell/contexts/i18n'
import type { HomeCodeWindowProblem } from './home-content'
import type { LintRuleReach } from './lint-content'

export interface LintExplorerRule {
  title: string
  file: string
  /** The source as the rule finds it; a fix preview carries its diff as `[!code --]` / `[!code ++]` lines. */
  code: string
  /** The source after the rule's fix. */
  fixedCode?: string
  /** The text the problem reports, starting at the reported column. */
  mark?: string
  problem: HomeCodeWindowProblem
  reach: LintRuleReach
}

/**
 * Each rule plays one check: the linter reads the classes, reports the problem in all three
 * surfaces at once, offers the quick fix and applies it. Rules without a fix stop at the report.
 */
type Phase = 'idle' | 'scan' | 'report' | 'action' | 'apply' | 'fixed'
type FixKind = 'sort' | 'remove' | 'diff' | 'report'

const phaseAt = { scan: 450, report: 1450, action: 2700, apply: 4100, fixed: 4950 }
/** How long a rule stays selected while the explorer tours, by whether it ends on a fix. */
const tourDuration = { fix: 8600, report: 6600 }

type Glyph = ComponentType<{ 'aria-hidden'?: boolean | 'true', className?: string, size?: number, stroke?: number }>

const severityIcons = {
  error: { Icon: IconCircleX, tone: 'home-tone-error' },
  info: { Icon: IconInfoCircle, tone: 'home-tone-info' },
  warning: { Icon: IconAlertTriangle, tone: 'home-tone-warn' }
}

export default function LintExplorer({ icons, rules }: { icons: ReactNode[], rules: LintExplorerRule[] }) {
  const $ = useTranslation()
  const [active, setActive] = useState(0)
  // The server renders the clean source; in view, the check plays from there.
  const [phase, setPhase] = useState<Phase>('idle')
  const [touring, setTouring] = useState(true)
  const [held, setHeld] = useState(false)
  const [finished, setFinished] = useState(false)
  const elapsedRef = useRef(0)
  const phaseRef = useRef<Phase>('idle')
  const flipRef = useRef<Map<string, DOMRect>>(undefined)
  const progressRef = useRef<HTMLSpanElement>(null)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const sourceRefs = useRef<(HTMLDivElement | null)[]>([])
  const menuRef = useRef<HTMLDivElement>(null)
  const { ref, inView } = useInView({ threshold: 0.3 })
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)', { initializeWithValue: false })
  const views = useMemo(() => rules.map(createRuleView), [rules])
  const view = views[active]
  const rule = rules[active]
  const finalPhase: Phase = view.kind === 'sort' || view.kind === 'remove' ? 'fixed' : 'report'
  const duration = view.kind === 'sort' || view.kind === 'remove' ? tourDuration.fix : tourDuration.report
  const playing = inView && !reduceMotion && !finished && (touring ? !held : true)

  function goTo(next: Phase) {
    if (next === phaseRef.current) return
    // The class order fix moves tokens: remember where each one starts before React reorders them.
    if (next === 'apply' && view.kind === 'sort') flipRef.current = measureTokens(sourceRefs.current[active])
    phaseRef.current = next
    setPhase(next)
  }

  // Each selection starts the check over, before paint, so a rule never shows the last rule's state;
  // without motion it opens straight on the problem and its fix.
  useLayoutEffect(() => {
    elapsedRef.current = 0
    setFinished(false)
    const start: Phase = reduceMotion ? (view.kind === 'sort' || view.kind === 'remove' ? 'action' : 'report') : 'idle'
    phaseRef.current = start
    setPhase(start)
    progressRef.current?.style.setProperty('--home-lint-progress', '0')
  }, [active, reduceMotion, view.kind])

  useEffect(() => {
    if (!playing) return
    let frame = 0
    let last = 0
    const tick = (time: number) => {
      if (last) elapsedRef.current += Math.min(time - last, 100)
      last = time
      const elapsed = elapsedRef.current
      progressRef.current?.style.setProperty('--home-lint-progress', String(Math.min(1, elapsed / duration)))
      goTo(timelinePhase(view.kind, elapsed))
      if (touring ? elapsed >= duration : elapsed >= phaseAt[finalPhase === 'fixed' ? 'fixed' : 'report']) {
        if (touring) setActive((index) => (index + 1) % rules.length)
        else setFinished(true)
        return
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
    // `goTo` reads the active rule through the values listed here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, duration, finalPhase, playing, rules.length, touring, view.kind])

  // Tokens glide from where they were to where the fix puts them: the sort reorders them in place,
  // and a fix preview copies them from the removed line into the added one.
  useLayoutEffect(() => {
    const source = sourceRefs.current[active]
    if (!source || reduceMotion) return
    if (phase === 'apply' && view.kind === 'sort' && flipRef.current) {
      const first = flipRef.current
      flipRef.current = undefined
      const order = view.sortedKeys
      for (const element of source.querySelectorAll<HTMLElement>('[data-token]')) {
        const from = first.get(element.dataset.token!)
        if (!from) continue
        const to = element.getBoundingClientRect()
        glide(element, from.left - to.left, from.top - to.top, order.indexOf(element.dataset.token!) * 45)
      }
    }
    if (phase === 'report' && view.kind === 'diff') {
      const removed = new Map([...source.querySelectorAll<HTMLElement>('[data-diff="remove"] [data-token]')].map((element) => [element.dataset.token!, element.getBoundingClientRect()]))
      source.querySelectorAll<HTMLElement>('[data-diff="add"] [data-token]').forEach((element, index) => {
        const from = removed.get(element.dataset.token!)
        if (!from) return
        const to = element.getBoundingClientRect()
        // One class after another, in the expected order, so the copy reads as taking them in turn.
        glide(element, from.left - to.left, from.top - to.top, index * 110)
      })
    }
  }, [active, phase, reduceMotion, view])

  // The quick fix menu opens under the first reported token and stays inside the editor.
  useLayoutEffect(() => {
    const menu = menuRef.current
    const source = sourceRefs.current[active]
    if (!menu || !source || phase !== 'action') return
    const place = () => {
      const anchor = source.querySelector<HTMLElement>('[data-marked]')
      const line = source.querySelector<HTMLElement>('[data-problem]')
      if (!anchor || !line) return
      const box = source.getBoundingClientRect()
      // The menu may use the whole code well, not just the source's own box.
      const area = source.closest('.home-lint-code')?.getBoundingClientRect() ?? box
      const target = anchor.getBoundingClientRect()
      // Under the whole reported line, so a wrapped class list stays readable above the menu.
      const lineBox = line.getBoundingClientRect()
      const left = Math.max(8, Math.min(target.left - box.left - 6, box.width - menu.offsetWidth - 8))
      const below = lineBox.bottom - box.top + 4
      const top = box.top + below + menu.offsetHeight <= area.bottom - 8 ? below : lineBox.top - box.top - menu.offsetHeight - 4
      menu.style.left = `${left}px`
      menu.style.top = `${top}px`
    }
    place()
    const observer = new ResizeObserver(place)
    observer.observe(source)
    return () => observer.disconnect()
  }, [active, phase])

  function select(index: number) {
    setTouring(false)
    setActive(index)
  }

  // A control that disappears hands focus back to the chosen rule, so keyboard readers keep their place.
  function keepFocus() {
    if (document.activeElement instanceof HTMLElement && document.activeElement.closest('.home-lint-menu, .home-lint-replay')) {
      tabRefs.current[active]?.focus()
    }
  }

  function applyFix() {
    keepFocus()
    setTouring(false)
    if (reduceMotion) {
      goTo('fixed')
      return
    }
    elapsedRef.current = phaseAt.apply
    setFinished(false)
    goTo('apply')
  }

  function replay() {
    keepFocus()
    setTouring(false)
    elapsedRef.current = 0
    setFinished(false)
    const start: Phase = reduceMotion ? (view.kind === 'sort' || view.kind === 'remove' ? 'action' : 'report') : 'idle'
    phaseRef.current = start
    setPhase(start)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const next = { ArrowDown: active + 1, ArrowRight: active + 1, ArrowUp: active - 1, ArrowLeft: active - 1, Home: 0, End: rules.length - 1 }[event.key]
    if (next === undefined) return
    event.preventDefault()
    const index = (next + rules.length) % rules.length
    select(index)
    tabRefs.current[index]?.focus()
  }

  const reported = phase === 'report' || phase === 'action' || phase === 'apply'
  const fixed = phase === 'fixed'
  // Replay returns to the start once a check has finished; without motion, once its fix is shown.
  const done = !touring && (reduceMotion ? phase === 'fixed' : finished)

  return (
    <div
      className="home-lint"
      data-phase={phase}
      data-reported={reported || fixed ? '' : undefined}
      data-severity={rule.problem.severity}
      data-touring={touring && !reduceMotion ? '' : undefined}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setHeld(false)
      }}
      onFocus={() => setHeld(true)}
      onPointerEnter={() => setHeld(true)}
      onPointerLeave={() => setHeld(false)}
      ref={ref}
      style={{ '--home-lint-columns': view.columns, '--home-lint-lines': view.lines.length } as CSSProperties}>
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
              <span aria-hidden="true" className="home-lint-rule-glyph">{icons[index]}</span>
              <span className="home-lint-rule-title">{$(item.title)}</span>
              {index === active && <span aria-hidden="true" className="home-lint-rule-progress" ref={progressRef} />}
            </button>
          ))}
        </div>
      </div>

      <div className="home-lint-stage">
        <div aria-labelledby={`home-lint-rule-${active}`} className="home-lint-editor" id="home-lint-panel" role="tabpanel">
          <div className="home-lint-bar">
            <span aria-hidden="true" className="home-lint-dots"><i /><i /><i /></span>
            <span className="home-lint-tab">
              <IconBrandHtml5 aria-hidden="true" className="home-lint-tab-icon" size={14} stroke={1.75} />
              <span className="home-lint-tab-label">{rule.file}</span>
            </span>
            <span className="home-lint-surface-name">{rule.problem.severity === 'info' ? $('MCP server') : 'ESLint'}</span>
            <LintStatus tone={phase === 'idle' ? 'idle' : phase === 'scan' ? 'running' : fixed ? 'ok' : rule.problem.severity}>
              {phase === 'idle'
                ? $('Ready')
                : phase === 'scan'
                  ? $('Checking')
                  : fixed
                    ? $('No problems')
                    : rule.problem.severity === 'info' ? $('1 file changed') : $('1 problem')}
            </LintStatus>
          </div>

          <div className="home-lint-code">
            <div className="home-lint-reading">
              <LintRuler view={view} />
              <div className="home-lint-sources">
                {views.map((item, index) => (
                  <LintSource
                    active={index === active}
                    key={rules[index].title}
                    phase={index === active ? phase : 'idle'}
                    ref={(node) => {
                      sourceRefs.current[index] = node
                    }}
                    view={item}>
                    {index === active && (view.kind === 'sort' || view.kind === 'remove') && (
                      <div aria-hidden={phase === 'action' ? undefined : 'true'} className="home-lint-menu" data-open={phase === 'action' ? '' : undefined} ref={menuRef}>
                        <p className="home-annotation home-lint-menu-label">{$('Quick fix')}</p>
                        <button className="home-lint-menu-item" onClick={applyFix} tabIndex={phase === 'action' ? 0 : -1} type="button">
                          <IconBulb aria-hidden="true" className="home-lint-menu-icon" size={14} stroke={1.75} />
                          <span>{String($('Fix this {rule} problem')).split('{rule}').flatMap((part, partIndex) => partIndex ? [<code key={partIndex}>{rule.problem.source}</code>, part] : [part])}</span>
                        </button>
                      </div>
                    )}
                  </LintSource>
                ))}
              </div>
              <span aria-hidden="true" className="home-lint-beam" />
            </div>
          </div>

          {/* One line: the rule and the place it points at; the message lives in the guide. */}
          <div className="home-lint-problems">
            <div aria-live={touring ? undefined : 'polite'} className="home-lint-problem-stack">
              {rules.map((item, index) => {
                const { Icon, tone: itemTone } = severityIcons[item.problem.severity]
                const current = index === active
                return (
                  <div aria-hidden={current ? undefined : 'true'} className="home-lint-problem-cell" data-active={current ? '' : undefined} key={item.title}>
                    <p className="home-lint-problem" data-shown={current && reported ? '' : undefined}>
                      <Icon aria-hidden="true" className={clsx('home-lint-problem-icon', itemTone)} size={15} stroke={1.75} />
                      <span className="home-lint-problem-rule">{item.problem.source}</span>
                      <span className="home-lint-loc">{shortLocation(item.problem.location)}</span>
                    </p>
                    {item.fixedCode && (
                      <p className="home-lint-problem" data-shown={current && fixed ? '' : undefined}>
                        <IconCircleCheck aria-hidden="true" className="home-lint-problem-icon home-tone-ok" size={15} stroke={1.75} />
                        <span className="home-lint-problem-rule">{item.problem.source}</span>
                        <span>{$('Fixed')}</span>
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
            {done && (
              <button className="home-lint-replay" onClick={replay} type="button">
                <IconRotateClockwise aria-hidden="true" size={14} stroke={1.75} />
                {$('Replay')}
              </button>
            )}
          </div>
        </div>

        <div className="home-lint-surfaces">
          <LintPane
            active={active}
            icon={IconTerminal2}
            litLabel={$('Same fix')}
            name={$('CLI')}
            note="@master/css-cli"
            phase={phase}
            rules={rules}
            views={views}>
            {(item, itemView) => <CliOutput rule={item} view={itemView} />}
          </LintPane>
          <LintPane
            active={active}
            icon={IconPlugConnected}
            litLabel={$('Preview')}
            name={$('MCP server')}
            note="@master/css-mcp"
            phase={phase}
            rules={rules}
            views={views}>
            {(item, itemView) => <McpOutput rule={item} view={itemView} />}
          </LintPane>
        </div>
      </div>
    </div>
  )
}

/** A column ruler over the code: the reported range is drawn on it like a dimension, with a guide down to the line. */
function LintRuler({ view }: { view: RuleView }) {
  const range = view.range
  return (
    <div aria-hidden="true" className="home-lint-ruler">
      {[10, 20, 30, 40, 50, 60, 70].map((column) => (
        <span
          className="home-lint-ruler-label"
          // A tick number under the location callout steps aside so the two never read as one.
          data-covered={range && column >= range.start - 2 && column <= range.start + String(range.line).length + String(range.start).length + 3 ? '' : undefined}
          key={column}
          style={{ '--column': column } as CSSProperties}>
          <span>{column}</span>
        </span>
      ))}
      {range && (
        <span className="home-lint-range" key={view.key} style={{ '--column': range.start, '--end': range.end, '--line': range.line } as CSSProperties}>
          <span className="home-lint-loc home-lint-range-label">{range.line}:{range.start}</span>
          <span className="home-lint-range-end" />
        </span>
      )}
    </div>
  )
}

interface LintSourceProps {
  active: boolean
  children?: ReactNode
  phase: Phase
  ref: (node: HTMLDivElement | null) => void
  view: RuleView
}

/** One rule's source. Only the chosen one plays; the others keep their cell so the editor never resizes. */
function LintSource({ active, children, phase, ref, view }: LintSourceProps) {
  const marked = phase === 'report' || phase === 'action' || (phase === 'apply' && view.kind === 'remove')
  const showFixed = view.fixedLines && ((view.kind === 'sort' && (phase === 'apply' || phase === 'fixed')) || (view.kind === 'remove' && phase === 'fixed'))
  const lines = showFixed ? view.fixedLines! : view.lines
  return (
    <div
      aria-hidden={active ? undefined : 'true'}
      className="home-lint-source"
      data-active={active ? '' : undefined}
      data-kind={view.kind}
      ref={ref}>
      {lines.map((line, index) => {
        // A diff numbers the removed line like the line that replaces it.
        const number = lines.slice(0, index).filter((item) => item.diff !== 'remove').length + 1
        const problemLine = view.range?.line === index + 1
        const glyph = line.diff
          ? <span className="home-lint-diff-sign">{line.diff === 'add' ? '+' : '−'}</span>
          : problemLine && marked && phase !== 'apply'
            ? phase === 'action'
              ? <IconBulb className="home-lint-bulb" size={13} stroke={1.75} />
              : <SeverityGlyph severity={view.severity} />
            : null
        return (
          <div className="home-lint-line" data-diff={line.diff} data-problem={problemLine && marked ? '' : undefined} key={index}>
            <span aria-hidden="true" className="home-lint-gutter">
              <span className="home-lint-glyph" key={phase === 'action' ? 'bulb' : 'mark'}>{glyph}</span>
              <span className="home-lint-number">{number}</span>
            </span>
            <code className="home-lint-text">
              {line.segments.map((segment, segmentIndex) => segment.kind === 'classes'
                ? (
                  <span key={segmentIndex}>
                    {segment.tokens.map((token, tokenIndex) => (
                      <TokenSlot
                        key={token.key}
                        leading={tokenIndex > 0}
                        marked={marked && token.marked}
                        markedNext={marked && token.markedNext}
                        order={phase === 'action' && view.kind === 'sort' ? view.sortedKeys.indexOf(token.key) + 1 : undefined}
                        removing={view.kind === 'remove' && view.removedKeys.includes(token.key) && (phase === 'apply')}
                        keeps={view.kind === 'remove' && token.key === view.keptKey && (phase === 'action' || phase === 'apply')}
                        token={token} />
                    ))}
                  </span>
                )
                : <span className={`home-lint-${segment.kind === 'text' ? 'plain' : segment.kind}`} key={segmentIndex}>{segment.text}</span>)}
            </code>
          </div>
        )
      })}
      {children}
    </div>
  )
}

function TokenSlot({ keeps, leading, marked, markedNext, order, removing, token }: {
  keeps: boolean
  leading: boolean
  marked: boolean
  markedNext: boolean
  order?: number
  removing: boolean
  token: ClassToken
}) {
  const separator = token.value.indexOf(':')
  const declaration = separator > 0 && /^[a-z-]+$/.test(token.value.slice(0, separator))
  return <>
    {leading && ' '}
    <span
      className="home-lint-token"
      data-keeps={keeps ? '' : undefined}
      data-marked={marked ? '' : undefined}
      data-marked-next={markedNext ? '' : undefined}
      data-removing={removing ? '' : undefined}
      data-token={token.key}
      style={{ '--column': token.column, '--length': token.value.length } as CSSProperties}>
      {declaration
        ? <><span className="home-lint-property">{token.value.slice(0, separator)}</span><span className="home-lint-punct">:</span>{token.value.slice(separator + 1)}</>
        : token.value}
      {order !== undefined && <span aria-hidden="true" className="home-lint-order" style={{ '--order': order } as CSSProperties}>{order}</span>}
    </span>
  </>
}

/** One status style for all three surfaces: a dot that carries the tone, and a quiet word. */
function LintStatus({ children, tone }: { children: ReactNode, tone: 'idle' | 'running' | 'off' | 'ok' | HomeCodeWindowProblem['severity'] }) {
  return <span className="home-lint-status" data-tone={tone}>{children}</span>
}

function SeverityGlyph({ severity }: { severity: HomeCodeWindowProblem['severity'] }) {
  const { Icon, tone } = severityIcons[severity]
  return <Icon className={tone} size={13} stroke={2} />
}

interface LintPaneProps {
  active: number
  icon: Glyph
  /** What the pane says when it shows a fix preview instead of a problem. */
  litLabel: string
  children: (rule: LintExplorerRule, view: RuleView) => ReactNode
  name: string
  note: string
  phase: Phase
  rules: LintExplorerRule[]
  views: RuleView[]
}

/** A surface beside the editor. It lights up the moment the editor reports, with the same rule at the same line and column. */
function LintPane({ active, children, icon: Icon, litLabel, name, note, phase, rules, views }: LintPaneProps) {
  const $ = useTranslation()
  const rule = rules[active]
  const off = Boolean(rule.reach.eslintOption)
  const state = off
    ? 'off'
    : phase === 'idle'
      ? 'idle'
      : phase === 'scan'
        ? 'running'
        : phase === 'fixed'
          ? 'resolved'
          : 'lit'
  return (
    <section className="home-lint-pane" data-state={state}>
      <header className="home-lint-pane-bar">
        <span className="home-lint-tab">
          <Icon aria-hidden="true" className="home-lint-tab-icon" size={14} stroke={1.75} />
          <span className="home-lint-tab-label">{name}</span>
        </span>
        <span className="home-lint-pane-package">{note}</span>
        <LintStatus tone={state === 'lit' ? rule.problem.severity : state === 'resolved' ? 'ok' : state}>
          {state === 'off' ? $('ESLint only') : state === 'resolved' ? $('Fixed') : state === 'lit' ? (rule.problem.severity === 'info' ? litLabel : $('1 problem')) : state === 'running' ? $('Running') : $('Ready')}
        </LintStatus>
      </header>
      <div className="home-lint-pane-body">
        {rules.map((item, index) => (
          <div aria-hidden={index === active ? undefined : 'true'} className="home-lint-pane-cell" data-active={index === active ? '' : undefined} key={item.title}>
            {children(item, views[index])}
          </div>
        ))}
      </div>
    </section>
  )
}

/**
 * The CLI's report for the sample: the command, then the stylish line's location, severity and rule.
 * The message column is left to the guide; a rule only ESLint runs shows no report at all.
 */
function CliOutput({ rule, view }: { rule: LintExplorerRule, view: RuleView }) {
  const { reach, problem } = rule
  if (!reach.cli) return null
  return (
    <pre className="home-lint-terminal">
      <span className="home-lint-command"><span className="home-lint-prompt">$</span> {reach.cli}</span>
      {view.kind !== 'diff' && (
        <span className="home-lint-out home-lint-report" style={{ '--i': 0 } as CSSProperties}>
          <span className="home-lint-loc">{view.range ? `${view.range.line}:${view.range.start}` : ''}</span>
          <span className={problem.severity === 'error' ? 'home-tone-error' : 'home-tone-warn'}>{problem.severity}</span>
          <span className="home-lint-rule-id">{problem.source}</span>
        </span>
      )}
    </pre>
  )
}

/** What the MCP server returns for the same sample: the same rule, severity, line and column, as JSON. */
function McpOutput({ rule, view }: { rule: LintExplorerRule, view: RuleView }) {
  const { reach, problem } = rule
  if (!reach.mcp) return null
  const key = (name: string) => <span className="home-lint-json-key">&quot;{name}&quot;</span>
  const value = (text: string | number) => <span className={typeof text === 'number' ? 'home-lint-json-number' : 'home-lint-json-string'}>{typeof text === 'number' ? text : `"${text}"`}</span>
  return (
    <pre className="home-lint-terminal">
      <span className="home-lint-command">
        <span className="home-lint-prompt">→</span> {reach.mcp}
        <span className="home-lint-call"> {rule.file}{reach.rules ? ` · rules: ${reach.rules}` : ''}</span>
      </span>
      {reach.mcp === 'mastercss_preview_fixes'
        ? <>
          <span className="home-lint-out" style={{ '--i': 0 } as CSSProperties}>{key('mode')}: {value('lint-fixes')},</span>
          <span className="home-lint-out" style={{ '--i': 1 } as CSSProperties}>{key('preview')}: {'{ '}{key('confirmToken')}: {value('…')}{' }'}</span>
        </>
        : <>
          <span className="home-lint-out" style={{ '--i': 0 } as CSSProperties}>{key('ruleId')}: {value(problem.source.replace('@master/css/', ''))},</span>
          <span className="home-lint-out" style={{ '--i': 1 } as CSSProperties}>{key('severity')}: {value(problem.severity)},</span>
          <span className="home-lint-out" style={{ '--i': 2 } as CSSProperties}>{key('loc')}: {'{ '}{key('start')}: {'{ '}<span className="home-lint-loc">{key('line')}: {value(view.range?.line ?? 1)}, {key('column')}: {value(view.range?.start ?? 1)}</span>{' } }'}</span>
        </>}
    </pre>
  )
}

/** `card.html:1:17` reads `1:17` beside the file's own tab; a location without a line keeps its file. */
function shortLocation(location: string) {
  const match = location.match(/:(\d+:\d+)$/)
  return match ? match[1] : location
}

/* Source model */

interface ClassToken {
  value: string
  /** Stable across the fix, so a token keeps its element when the sort moves it. */
  key: string
  column: number
  marked: boolean
  markedNext: boolean
}

type Segment = { kind: 'punct' | 'tag' | 'attr' | 'string' | 'text', text: string } | { kind: 'classes', tokens: ClassToken[] }

interface CodeLine {
  diff?: 'add' | 'remove'
  segments: Segment[]
}

interface RuleView {
  key: string
  kind: FixKind
  severity: HomeCodeWindowProblem['severity']
  lines: CodeLine[]
  fixedLines?: CodeLine[]
  /** The reported line and columns, from the problem location and the marked text. */
  range?: { line: number, start: number, end: number }
  sortedKeys: string[]
  removedKeys: string[]
  keptKey?: string
  /** The longest line, which the scan reads to the end of. */
  columns: number
}

function createRuleView(rule: LintExplorerRule): RuleView {
  const lines = parseCode(rule.code, rule.mark)
  const fixedLines = rule.fixedCode ? parseCode(rule.fixedCode) : undefined
  const tokensOf = (source: CodeLine[]) => source.flatMap((line) => line.segments.flatMap((segment) => segment.kind === 'classes' ? segment.tokens.map((token) => token.key) : []))
  const before = tokensOf(lines)
  const after = fixedLines ? tokensOf(fixedLines) : []
  const kind: FixKind = lines.some((line) => line.diff)
    ? 'diff'
    : !fixedLines
      ? 'report'
      : after.length === before.length
        ? 'sort'
        : 'remove'
  const [, line, column] = rule.problem.location.split(':').map(Number)
  return {
    key: rule.title,
    kind,
    severity: rule.problem.severity,
    lines,
    fixedLines,
    range: rule.mark && line ? { line, start: column, end: column + rule.mark.length } : undefined,
    sortedKeys: after,
    removedKeys: before.filter((key) => fixedLines && !after.includes(key)),
    keptKey: rule.problem.message.match(/overridden by class "([^"]+)"/)?.[1],
    columns: Math.max(...rule.code.trim().split('\n').map((text) => text.replace(/\s*<!--.*-->\s*$/, '').length))
  }
}

/** Split an HTML sample into highlighted segments, with each class as its own token. */
function parseCode(code: string, mark?: string): CodeLine[] {
  let markLine = -1
  return code.trim().split('\n').map((raw, index) => {
    const diff = raw.includes('[!code ++]') ? 'add' : raw.includes('[!code --]') ? 'remove' : undefined
    const text = raw.replace(/\s*<!--\s*\[!code [+-]{2}\]\s*-->\s*$/, '')
    const markStart = mark && markLine < 0 ? text.indexOf(mark) : -1
    if (markStart >= 0) markLine = index
    return { diff, segments: tokenize(text, markStart, markStart + (mark?.length ?? 0)) }
  })
}

function tokenize(text: string, markStart: number, markEnd: number): Segment[] {
  const segments: Segment[] = []
  const pattern = /(<\/?)([\w-]+)|(\s+)([\w-]+)="([^"]*)"|(\/?>)|([^<]+)/g
  let match: RegExpExecArray | null
  while ((match = pattern.exec(text))) {
    const [, open, tag, space, attribute, value, close, plain] = match
    if (open) {
      segments.push({ kind: 'punct', text: open }, { kind: 'tag', text: tag })
    } else if (attribute) {
      segments.push({ kind: 'text', text: space }, { kind: 'attr', text: attribute }, { kind: 'punct', text: '="' })
      if (attribute === 'class') {
        segments.push({ kind: 'classes', tokens: classTokens(value, match.index + space.length + attribute.length + 2, markStart, markEnd) })
      } else {
        segments.push({ kind: 'string', text: value })
      }
      segments.push({ kind: 'punct', text: '"' })
    } else if (close) {
      segments.push({ kind: 'punct', text: close })
    } else {
      segments.push({ kind: 'text', text: plain })
    }
  }
  return segments
}

function classTokens(value: string, start: number, markStart: number, markEnd: number): ClassToken[] {
  const seen = new Map<string, number>()
  const tokens: ClassToken[] = []
  let at = start
  for (const className of value.split(' ')) {
    const count = seen.get(className) ?? 0
    seen.set(className, count + 1)
    tokens.push({
      value: className,
      key: count ? `${className}#${count}` : className,
      column: at + 1,
      marked: markStart >= 0 && at < markEnd && at + className.length > markStart,
      markedNext: false
    })
    at += className.length + 1
  }
  tokens.forEach((token, index) => {
    token.markedNext = token.marked && Boolean(tokens[index + 1]?.marked)
  })
  return tokens
}

function timelinePhase(kind: FixKind, elapsed: number): Phase {
  if (elapsed < phaseAt.scan) return 'idle'
  if (elapsed < phaseAt.report) return 'scan'
  if (kind === 'report' || kind === 'diff' || elapsed < phaseAt.action) return 'report'
  if (elapsed < phaseAt.apply) return 'action'
  if (elapsed < phaseAt.fixed) return 'apply'
  return 'fixed'
}

function measureTokens(source: HTMLElement | null) {
  const rects = new Map<string, DOMRect>()
  source?.querySelectorAll<HTMLElement>('[data-token]').forEach((element) => rects.set(element.dataset.token!, element.getBoundingClientRect()))
  return rects
}

/**
 * Move a token from its old place to its new one. A token pulled forward lifts off the line as a chip and
 * passes over the others; a token pushed back slides along the line underneath it.
 */
function glide(element: HTMLElement, dx: number, dy: number, delay: number) {
  if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return
  const lifts = dx > 0 || Math.abs(dy) > 1
  element.dataset.moving = lifts ? 'lift' : 'slide'
  // Each segment carries its own easing: the lift rises out smoothly and lands with a short settle;
  // a token passing underneath eases in and out and dims while it crosses.
  const keyframes: Keyframe[] = lifts
    ? [
      { transform: `translate(${dx}px, ${dy}px)`, easing: 'cubic-bezier(0.3, 0, 0.2, 1)' },
      { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - (dy ? 0 : 16)}px) scale(1.06)`, offset: 0.45, easing: 'cubic-bezier(0.34, 1.32, 0.64, 1)' },
      { transform: 'translate(0, 0)' }
    ]
    : [
      { transform: `translate(${dx}px, ${dy}px)`, easing: 'cubic-bezier(0.65, 0, 0.35, 1)' },
      // The farther a token travels under the others, the deeper and fainter it passes.
      { transform: `translate(${dx * 0.5}px, ${Math.min(7, Math.abs(dx) / 20)}px)`, opacity: Math.max(0.3, 1 - Math.abs(dx) / 300), offset: 0.5, easing: 'cubic-bezier(0.65, 0, 0.35, 1)' },
      { transform: 'translate(0, 0)' }
    ]
  const animation = element.animate(keyframes, { duration: lifts ? 1000 : 860, delay, easing: 'linear', fill: 'backwards' })
  animation.finished.then(() => delete element.dataset.moving, () => delete element.dataset.moving)
}
