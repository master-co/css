'use client'

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { IconAlertTriangle, IconArrowRight, IconCircleCheck, IconPencil, IconPlayerPlay } from '@tabler/icons-react'
import { useInView } from 'react-intersection-observer'
import { useMediaQuery } from 'usehooks-ts'
import clsx from 'clsx'
import { useTranslation } from '~/site/docs-shell/contexts/i18n'

export interface HeroComposerRule {
  token: string
  /** A wrapping at-rule such as `@media (width >= 64rem)`, when the class has a condition. */
  atRule?: string
  selector: string
  declarations: [string, string][]
}

/** A class the reader typed, with its rule from the page's runtime, or none when it generates no CSS. */
type LiveRule = { token: string, rule?: HeroComposerRule }

/** The Master CSS runtime this page runs on; while editing, the composer asks it for each class's rule. */
interface PageRuntime {
  ready: Promise<unknown>
  ensureClassRules: (classNames: string[]) => unknown
  snapshot: () => { classRules: Record<string, { rules: { text: string }[] } | undefined> }
}

function pageRuntime() {
  return (globalThis as { masterCSSRuntime?: PageRuntime }).masterCSSRuntime
}

type Phase = 'typing' | 'problem' | 'done'

interface ComposerState {
  phase: Phase
  /** Completed tokens; during typing, the next token is partially typed. */
  tokens: number
  characters: number
}

const characterDelay = 34
const tokenDelay = 360
const problemDelay = 1900
const doneDelay = 4200
const visibleRules = 4
/** How long typing must pause before an edited class list reaches the runtime. */
const typingPause = 300
const finalState: ComposerState = { phase: 'done', tokens: Infinity, characters: 0 }

/** Types classes onto a button, shows the CSS each one generates, then applies the class order fix. */
export default function HeroComposer({ problem, rules, sortedTokens }: {
  problem: string
  rules: HeroComposerRule[]
  sortedTokens: string[]
}) {
  const $ = useTranslation()
  // The server renders the finished state; motion replays it from the start in view.
  const [state, setState] = useState<ComposerState>(finalState)
  // Pointing at a class shows the rule it generates; the loop holds still while the pointer is inside.
  const [inspected, setInspected] = useState<string>()
  const [held, setHeld] = useState(false)
  // Editing hands the class list to the reader; the page's own runtime renders whatever they type.
  const [canEdit, setCanEdit] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  // The class list the preview and the runtime see: the draft once typing pauses, so half-typed
  // states such as `:ho` never reach the page's stylesheet.
  const [applied, setApplied] = useState('')
  const [liveRules, setLiveRules] = useState<LiveRule[]>([])
  const [caretToken, setCaretToken] = useState<string>()
  const editableRef = useRef<HTMLSpanElement>(null)
  const editButtonRef = useRef<HTMLButtonElement>(null)
  const editStartRef = useRef('')
  const { ref, inView } = useInView({ threshold: 0.25 })
  const surfaceRef = useRef<HTMLDivElement | null>(null)
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)', { initializeWithValue: false })

  // The window leans toward the pointer; CSS turns these offsets into a few degrees of tilt.
  const tilt = (event?: PointerEvent<HTMLDivElement>) => {
    const surface = surfaceRef.current
    if (!surface) return
    const rect = surface.getBoundingClientRect()
    const lean = event && !editing
    surface.style.setProperty('--home-tilt-x', lean ? ((event.clientX - rect.left) / rect.width - 0.5).toFixed(3) : '0')
    surface.style.setProperty('--home-tilt-y', lean ? ((event.clientY - rect.top) / rect.height - 0.5).toFixed(3) : '0')
  }

  useEffect(() => {
    if (!inView || reduceMotion || held || editing) return
    const timeout = setTimeout(() => setState(nextState(state, rules)), delayOf(state, rules))
    return () => clearTimeout(timeout)
  }, [editing, held, inView, reduceMotion, rules, state])

  // Editing needs the runtime; pages without one keep the demo read-only.
  useEffect(() => {
    setCanEdit(Boolean(pageRuntime()))
  }, [])

  // Start with the caret after the last class, ready to type.
  useEffect(() => {
    const editable = editableRef.current
    if (!editing || !editable) return
    editable.focus()
    const range = document.createRange()
    range.selectNodeContents(editable)
    range.collapse(false)
    getSelection()?.removeAllRanges()
    getSelection()?.addRange(range)
  }, [editing])

  // Each pause in typing asks the runtime for the rules; classes it cannot generate come back empty.
  useEffect(() => {
    const runtime = pageRuntime()
    if (!editing || !runtime) return
    let cancelled = false
    const timeout = setTimeout(async () => {
      await runtime.ready
      if (cancelled) return
      const tokens = [...new Set(draft.split(/\s+/).filter(Boolean))]
      runtime.ensureClassRules(tokens)
      const { classRules } = runtime.snapshot()
      setApplied(tokens.join(' '))
      setLiveRules(tokens.map((token) => ({ token, rule: parseRule(token, classRules[token]?.rules[0]?.text) })))
    }, typingPause)
    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
  }, [draft, editing])

  function startEditing() {
    editStartRef.current = sortedTokens.join(' ')
    setDraft(editStartRef.current)
    setApplied(editStartRef.current)
    setInspected(undefined)
    setEditing(true)
    tilt()
  }

  function stopEditing() {
    setEditing(false)
    setLiveRules([])
    setCaretToken(undefined)
    setState({ phase: 'typing', tokens: 0, characters: 0 })
  }

  // The class under the caret is the one whose rule the panel lifts.
  function updateCaret() {
    const editable = editableRef.current
    const selection = getSelection()
    if (!editable || !selection?.rangeCount || !editable.contains(selection.anchorNode)) return
    const before = document.createRange()
    before.selectNodeContents(editable)
    before.setEnd(selection.anchorNode!, selection.anchorOffset)
    const offset = before.toString().length
    const text = editable.textContent ?? ''
    const start = text.slice(0, offset).search(/\S*$/)
    const end = offset + (text.slice(offset).match(/^\S*/)?.[0].length ?? 0)
    setCaretToken(text.slice(start, end) || undefined)
  }

  function handleEditKeyDown(event: KeyboardEvent<HTMLSpanElement>) {
    // A class attribute is one line; Escape hands focus to the Replay button without ending the edit.
    if (event.key === 'Enter') event.preventDefault()
    if (event.key === 'Escape') editButtonRef.current?.focus()
  }

  const typedTokens = rules.slice(0, Math.min(state.tokens, rules.length)).map((rule) => rule.token)
  const typing = state.phase === 'typing' ? rules[state.tokens]?.token.slice(0, state.characters) : undefined
  const classTokens = state.phase === 'done' ? sortedTokens : typedTokens
  const typedRules = rules.slice(0, Math.min(state.tokens, rules.length))
  const inspectedRule = inspected ? rules.find((rule) => rule.token === inspected) : undefined
  // The inspected rule joins the newest ones, so it always shows where the reader is looking.
  const shownRules = inspectedRule ? [...typedRules.filter((rule) => rule !== inspectedRule).slice(1 - visibleRules), inspectedRule] : typedRules.slice(-visibleRules)
  const latestRule = inspectedRule?.token ?? (state.phase === 'typing' ? typedRules.at(-1)?.token : undefined)
  const caretRule = liveRules.find((item) => item.token === caretToken)
  const shownLiveRules = caretRule ? [...liveRules.filter((item) => item !== caretRule).slice(1 - visibleRules), caretRule] : liveRules.slice(-visibleRules)
  const missing = liveRules.filter((item) => !item.rule).length

  return (
    <div
      className="home-composer"
      data-editing={editing ? '' : undefined}
      data-phase={editing ? 'editing' : state.phase}
      onPointerEnter={() => setHeld(true)}
      onPointerLeave={() => {
        tilt()
        setHeld(false)
        setInspected(undefined)
      }}
      onPointerMove={tilt}
      ref={(node) => {
        ref(node)
        surfaceRef.current = node
      }}>
      <div className="home-composer-bar">
        <span aria-hidden="true" className="display:flex gap-2xs">
          <span className="home-code-window-dot" />
          <span className="home-code-window-dot" />
          <span className="home-code-window-dot" />
        </span>
        <span className="home-composer-tab">pricing.html</span>
        {editing
          ? <span className="home-composer-live home-status home-status-live">{$('Live')}</span>
          : (
            <ol aria-hidden="true" className="home-composer-steps">
              <li data-step="typing">{$('Compose')}</li>
              <li data-step="problem">{$('Check')}</li>
              <li data-step="done">{$('Fix')}</li>
            </ol>
          )}
        {editing
          ? (
            <span aria-live="polite" className={clsx('home-composer-status', missing ? 'home-composer-status-warning' : 'home-composer-status-ok')}>
              {missing
                ? <><IconAlertTriangle aria-hidden="true" size={14} stroke={1.75} />{$('{count} without CSS').replace('{count}', String(missing))}</>
                : <><IconCircleCheck aria-hidden="true" size={14} stroke={1.75} />{$('All classes generate CSS')}</>}
            </span>
          )
          : (
            <span className={clsx('home-composer-status', state.phase === 'problem' && 'home-composer-status-warning', state.phase === 'done' && 'home-composer-status-ok')}>
              {state.phase === 'problem'
                ? <><IconAlertTriangle aria-hidden="true" size={14} stroke={1.75} />{$('1 problem')}</>
                : state.phase === 'done'
                  ? <><IconCircleCheck aria-hidden="true" size={14} stroke={1.75} />{$('No problems')}</>
                  : $('Composing')}
            </span>
          )}
      </div>
      <div className="grid-cols(1) grid-cols(12)@md">
        <div className="display:flex flex-direction:column min-width:0 grid-col-span(7)@md home-composer-source">
          {canEdit && (
            <button className="home-composer-edit" onClick={editing ? stopEditing : startEditing} ref={editButtonRef} type="button">
              {editing
                ? <><IconPlayerPlay aria-hidden="true" size={14} stroke={1.75} />{$('Replay')}</>
                : <><IconPencil aria-hidden="true" size={14} stroke={1.75} />{$('Edit classes')}</>}
            </button>
          )}
          <pre className="home-composer-markup">
            <span className="home-composer-muted">{'<article class="plan-card">\n  <h3>Pro plan</h3>\n  <button class="'}</span>
            {editing
              ? (
                <span
                  aria-label={$('Classes on the Upgrade button')}
                  className="home-composer-editable"
                  contentEditable="plaintext-only"
                  onClick={updateCaret}
                  onInput={(event) => {
                    setDraft(event.currentTarget.textContent ?? '')
                    updateCaret()
                  }}
                  onKeyDown={handleEditKeyDown}
                  onKeyUp={updateCaret}
                  ref={editableRef}
                  role="textbox"
                  spellCheck={false}
                  suppressContentEditableWarning
                  tabIndex={0}>
                  {editStartRef.current}
                </span>
              )
              : (
                <span className={clsx('home-composer-classes', state.phase === 'problem' && 'home-composer-classes-problem', state.phase === 'done' && 'home-composer-classes-fixed')} key={state.phase === 'done' ? 'sorted' : 'typed'}>
                  {classTokens.map((token, index) => (
                    <span key={token}>
                      {index ? ' ' : ''}
                      <span className={clsx('home-composer-token', token === inspected && 'home-composer-token-inspected')} onPointerEnter={() => setInspected(token)}>{token}</span>
                    </span>
                  ))}
                  {typing !== undefined && <span className="home-composer-token home-composer-token-typing">{typedTokens.length ? ' ' : ''}{typing}</span>}
                  {state.phase === 'typing' && <span aria-hidden="true" className="home-composer-caret" />}
                </span>
              )}
            <span className="home-composer-muted">{'">\n    Upgrade\n  </button>\n</article>'}</span>
          </pre>
          <div className="home-composer-css">
            <p className="home-composer-panel-label">
              {$('Generated CSS')}
              <span className={clsx('home-composer-hint', !editing && 'home-composer-hint-pointer')}>{editing ? $('Generated by the runtime on this page') : $('Point at a class to see its rule')}</span>
            </p>
            <div className="home-composer-rules">
              {editing
                ? shownLiveRules.map(({ rule, token }) => rule
                  ? <RuleLine key={token} latest={token === caretToken} rule={rule} />
                  : (
                    <code className={clsx('home-composer-rule home-composer-rule-missing', token === caretToken && 'home-composer-rule-latest')} key={token}>
                      {token} <span className="home-composer-rule-note">— {$('no CSS generated')}</span>
                    </code>
                  ))
                : shownRules.map((rule) => <RuleLine key={rule.token} latest={rule.token === latestRule} rule={rule} />)}
            </div>
          </div>
          <div className={clsx('home-composer-problems', state.phase === 'problem' && 'home-composer-problems-open')} aria-live="polite">
            {state.phase === 'problem' && <>
              <IconAlertTriangle aria-hidden="true" className="flex:none home-tone-warn" size={16} stroke={1.75} />
              <span className="min-width:0">
                <span className="display:block overflow:hidden text-overflow:ellipsis white-space:nowrap fg-text-strong">{problem}</span>
                <span className="display:block font-2xs fg-text-muted">@master/css/sort-classes · {$('autofix available')}</span>
              </span>
            </>}
          </div>
        </div>
        <div className="grid-col-span(5)@md home-composer-preview">
          <p className="home-composer-panel-label">{$('Preview')}</p>
          <article className="home-composer-card">
            <span className="width:fit-content py-4xs px-xs r-pill font-2xs font-semibold tracking-wider text-transform:uppercase bg-surface-inset fg-text-muted">{$('Popular')}</span>
            <p className="text-xl font-medium fg-text-strong">{$('Pro plan')}</p>
            <p className="font-5xl font-medium line-height:1 tracking-tight fg-text-strong">$12<span className="font-sm font-regular tracking-normal fg-text-muted">/{$('month')}</span></p>
            <p className="text-sm fg-text-muted">{$('Unlimited projects, priority support and team policies.')}</p>
            <div className="min-height:3rem mt-sm">
              {/* The preview renders the classes; it is not a control, so it stays out of the tab order. */}
              <button className={editing ? applied : clsx(classTokens)} tabIndex={-1} type="button">
                {$('Upgrade')}
                <IconArrowRight aria-hidden="true" size={16} stroke={2} />
              </button>
            </div>
          </article>
        </div>
      </div>
    </div>
  )
}

function RuleLine({ latest, rule }: { latest: boolean, rule: HeroComposerRule }) {
  return (
    <code className={clsx('home-composer-rule', latest && 'home-composer-rule-latest')}>
      {rule.atRule && <span className="home-composer-at-rule">{rule.atRule} {'{ '}</span>}
      <span className="home-composer-selector">{rule.selector}</span>{' { '}
      {rule.declarations.map(([property, value]) => (
        <span key={property}><span className="home-composer-property">{property}</span>: <span className="home-composer-value">{value}</span>; </span>
      ))}
      {'}'}
      {rule.atRule && <span className="home-composer-at-rule">{' }'}</span>}
    </code>
  )
}

/** Split a generated rule such as `@media (…){.a:hover{color:red}}` into its parts for display. */
function parseRule(token: string, text?: string): HeroComposerRule | undefined {
  if (!text) return
  const wrapped = text.match(/^(@[^{]+)\{(.*)\}$/)
  const match = (wrapped ? wrapped[2] : text).match(/^([^{]+)\{([^}]*)\}$/)
  if (!match) return
  return {
    token,
    atRule: wrapped?.[1].trim(),
    selector: match[1],
    declarations: match[2].split(';').filter(Boolean).map((declaration) => {
      const index = declaration.indexOf(':')
      return [declaration.slice(0, index), declaration.slice(index + 1)] as [string, string]
    })
  }
}

function delayOf(state: ComposerState, rules: HeroComposerRule[]) {
  if (state.phase === 'done') return doneDelay
  if (state.phase === 'problem') return problemDelay
  return state.characters < (rules[state.tokens]?.token.length ?? 0) ? characterDelay : tokenDelay
}

function nextState(state: ComposerState, rules: HeroComposerRule[]): ComposerState {
  if (state.phase === 'done') return { phase: 'typing', tokens: 0, characters: 0 }
  if (state.phase === 'problem') return finalState
  const token = rules[state.tokens]
  if (!token) return { phase: 'problem', tokens: rules.length, characters: 0 }
  if (state.characters < token.token.length) return { ...state, characters: state.characters + 1 }
  return { phase: 'typing', tokens: state.tokens + 1, characters: 0 }
}
