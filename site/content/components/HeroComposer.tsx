'use client'

import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { IconAlertTriangle, IconArrowRight, IconCircleCheck } from '@tabler/icons-react'
import { useInView } from 'react-intersection-observer'
import { useMediaQuery } from 'usehooks-ts'
import clsx from 'clsx'
import { useTranslation } from '~/site/docs-shell/contexts/i18n'

export interface HeroComposerRule {
  token: string
  selector: string
  declarations: [string, string][]
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
  const { ref, inView } = useInView({ threshold: 0.25 })
  const surfaceRef = useRef<HTMLDivElement | null>(null)
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)', { initializeWithValue: false })

  // The window leans toward the pointer; CSS turns these offsets into a few degrees of tilt.
  const tilt = (event?: PointerEvent<HTMLDivElement>) => {
    const surface = surfaceRef.current
    if (!surface) return
    const rect = surface.getBoundingClientRect()
    surface.style.setProperty('--home-tilt-x', event ? ((event.clientX - rect.left) / rect.width - 0.5).toFixed(3) : '0')
    surface.style.setProperty('--home-tilt-y', event ? ((event.clientY - rect.top) / rect.height - 0.5).toFixed(3) : '0')
  }

  useEffect(() => {
    if (!inView || reduceMotion) return
    const timeout = setTimeout(() => setState(nextState(state, rules)), delayOf(state, rules))
    return () => clearTimeout(timeout)
  }, [inView, reduceMotion, rules, state])

  const typedTokens = rules.slice(0, Math.min(state.tokens, rules.length)).map((rule) => rule.token)
  const typing = state.phase === 'typing' ? rules[state.tokens]?.token.slice(0, state.characters) : undefined
  const classTokens = state.phase === 'done' ? sortedTokens : typedTokens
  const shownRules = rules.slice(0, Math.min(state.tokens, rules.length))
  const latestRule = state.phase === 'typing' ? shownRules.at(-1)?.token : undefined

  return (
    <div
      className="home-composer"
      data-phase={state.phase}
      onPointerLeave={() => tilt()}
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
        <ol aria-hidden="true" className="home-composer-steps">
          <li data-step="typing">{$('Compose')}</li>
          <li data-step="problem">{$('Check')}</li>
          <li data-step="done">{$('Fix')}</li>
        </ol>
        <span className={clsx('home-composer-status', state.phase === 'problem' && 'home-composer-status-warning', state.phase === 'done' && 'home-composer-status-ok')}>
          {state.phase === 'problem'
            ? <><IconAlertTriangle aria-hidden="true" size={14} stroke={1.75} />{$('1 problem')}</>
            : state.phase === 'done'
              ? <><IconCircleCheck aria-hidden="true" size={14} stroke={1.75} />{$('No problems')}</>
              : $('Composing')}
        </span>
      </div>
      <div className="grid-cols(1) grid-cols(12)@lg">
        <div className="display:flex flex-direction:column min-width:0 grid-col-span(7)@lg home-composer-source">
          <pre className="home-composer-markup">
            <span className="home-composer-muted">{'<article class="plan-card">\n  <h3>Pro plan</h3>\n  <button class="'}</span>
            <span className={clsx('home-composer-classes', state.phase === 'problem' && 'home-composer-classes-problem', state.phase === 'done' && 'home-composer-classes-fixed')} key={state.phase === 'done' ? 'sorted' : 'typed'}>
              {classTokens.map((token, index) => (
                <span className="home-composer-token" key={token}>{index ? ' ' : ''}{token}</span>
              ))}
              {typing !== undefined && <span className="home-composer-token home-composer-token-typing">{typedTokens.length ? ' ' : ''}{typing}</span>}
              {state.phase === 'typing' && <span aria-hidden="true" className="home-composer-caret" />}
            </span>
            <span className="home-composer-muted">{'">\n    Upgrade\n  </button>\n</article>'}</span>
          </pre>
          <div className="home-composer-css">
            <p className="home-composer-panel-label">{$('Generated CSS')}</p>
            <div className="home-composer-rules">
              {shownRules.slice(-visibleRules).map((rule) => (
                <code className={clsx('home-composer-rule', rule.token === latestRule && 'home-composer-rule-latest')} key={rule.token}>
                  <span className="home-composer-selector">{rule.selector}</span>{' { '}
                  {rule.declarations.map(([property, value]) => (
                    <span key={property}><span className="home-composer-property">{property}</span>: <span className="home-composer-value">{value}</span>; </span>
                  ))}
                  {'}'}
                </code>
              ))}
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
        <div className="grid-col-span(5)@lg home-composer-preview">
          <p className="home-composer-panel-label">{$('Preview')}</p>
          <article className="home-composer-card">
            <span className="width:fit-content py-4xs px-xs r-pill font-2xs font-semibold tracking-wider text-transform:uppercase bg-surface-inset fg-text-muted">{$('Popular')}</span>
            <h3 className="text-xl font-medium fg-text-strong">{$('Pro plan')}</h3>
            <p className="font-5xl font-medium line-height:1 tracking-tight fg-text-strong">$12<span className="font-sm font-regular tracking-normal fg-text-muted">/{$('month')}</span></p>
            <p className="text-sm fg-text-muted">{$('Unlimited projects, priority support and team policies.')}</p>
            <div className="min-height:3rem mt-sm">
              <button className={clsx(classTokens)} type="button">
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
