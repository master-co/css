'use client'

import { Fragment, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { IconAlertTriangle, IconCircleCheck, IconFileCode, IconLoader2, IconPencil, IconPlayerPauseFilled, IconPlayerPlayFilled, IconShieldCheck, IconSparkles, IconUser } from '@tabler/icons-react'
import { useInView } from 'react-intersection-observer'
import { useMediaQuery } from 'usehooks-ts'
import clsx from 'clsx'
import { useTranslation } from '~/site/docs-shell/contexts/i18n'
import { agentSessionCalls, agentSessionResults, agentSessionStages, type AgentSessionCallId } from './agents-content'
import { AgentsOrbit } from './AgentsFigures'
import type { HomeCodeWindowProblem } from './home-content'

/** The window's three panes. A narrow window shows one at a time and follows the one that changes. */
type Pane = 'chat' | 'code' | 'output'

/** The session, beat by beat: its step, how long it holds in milliseconds, and the pane a narrow window shows. */
const beats: { stage: number, ms: number, pane: Pane }[] = [
  { stage: 0, ms: 1800, pane: 'chat' },
  { stage: 0, ms: 1700, pane: 'chat' },
  { stage: 0, ms: 1000, pane: 'chat' },
  { stage: 0, ms: 2800, pane: 'output' },
  { stage: 1, ms: 3000, pane: 'code' },
  { stage: 1, ms: 1000, pane: 'chat' },
  { stage: 1, ms: 3000, pane: 'code' },
  { stage: 2, ms: 1000, pane: 'chat' },
  { stage: 2, ms: 3600, pane: 'output' },
  { stage: 3, ms: 1000, pane: 'chat' },
  { stage: 3, ms: 2800, pane: 'code' },
  { stage: 3, ms: 2800, pane: 'chat' },
  { stage: 3, ms: 1500, pane: 'chat' },
  { stage: 4, ms: 1300, pane: 'output' },
  { stage: 4, ms: 2300, pane: 'output' },
  { stage: 4, ms: 900, pane: 'chat' },
  { stage: 4, ms: 5600, pane: 'chat' },
  { stage: 4, ms: 700, pane: 'chat' }
]

/** Named beats, so the script below reads in story order. The prompt is there from the first beat. */
const at = { prompt: 0, reply: 1, manifest: 2, tokens: 3, edit: 4, inspect: 5, rule: 6, lint: 7, problems: 8, preview: 9, diff: 10, ask: 11, confirm: 12, apply: 13, written: 14, relint: 15, clean: 16, outro: 17 }

/** The beat that completes each step; choosing a step shows it. */
const stageEnds = agentSessionStages.map((_, stage) => beats.findLastIndex((beat, index) => beat.stage === stage && index !== at.outro))
const finalBeat = stageEnds[stageEnds.length - 1]
/** The first tour opens on a full frame: the conversation so far, the card underlined where it fails lint, and the four problems. */
const firstBeat = at.problems

type Entry =
  | { at: number, kind: 'agent' | 'user', text: string }
  | { at: number, kind: 'edit' }
  | { at: number, kind: 'call', id: AgentSessionCallId, done: number }

type Mode = 'chosen' | 'paused' | 'tour'

/** Every inline icon in the window shares one size and stroke, so rows line up and read alike. */
const icon = { size: 14, stroke: 1.75 } as const

export interface AgentSessionProps {
  /** Decorative SVG slots rendered on the server. */
  toolIcons: Record<AgentSessionCallId, ReactNode>
  code: string
  file: string
  fixedCode: string
  problems: HomeCodeWindowProblem[]
  /** The spacing tokens `mastercss_manifest_query` returns from the manifest. */
  tokens: { name: string, value: string }[]
  /** What `mastercss_inspect_class` reports for the inspected class: its rule, statuses, layer and the token behind it. */
  inspection: AgentSessionInspection
  /** Real classes for the floor of the MCP figure under the window. */
  classRows: readonly string[]
}

export interface AgentSessionInspection {
  selector: string
  declarations: { property: string, value: string }[]
  matchStatus: string
  cssSyntaxStatus: string
  layer: string
  variable: { name: string, value: string }
}

/**
 * An agent session over the Master CSS MCP server: the agent reads the spacing tokens, styles the
 * plan card, inspects a class, lints its own draft, previews the fix as a diff with a confirmation
 * token and applies it after the server checks the file has not changed. The transcript, the file
 * and the server's output play in step; the step bar pauses the session or opens any step.
 */
export default function AgentSession({ classRows, code, file, fixedCode, inspection, problems, tokens, toolIcons }: AgentSessionProps) {
  const $ = useTranslation()
  // The server renders the finished session. Once the page can play it, the tour starts on a frame
  // that already has a conversation, a file and a result in it (firstBeat); later loops start from the prompt.
  const [beat, setBeat] = useState(finalBeat)
  const [mode, setMode] = useState<Mode>('chosen')
  const [held, setHeld] = useState(false)
  const [loop, setLoop] = useState(0)
  const [pinned, setPinned] = useState<Pane>()
  const { ref, inView } = useInView({ threshold: 0.25 })
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)', { initializeWithValue: false })
  const running = mode === 'tour' && inView && !held && !reduceMotion
  const remaining = useRef<{ beat: number, ms: number }>(undefined)

  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    setBeat(firstBeat)
    setMode('tour')
  }, [])

  // Reduced motion shows the finished session, with every step still open to choose.
  useEffect(() => {
    if (!reduceMotion) return
    setMode('chosen')
    setBeat(finalBeat)
  }, [reduceMotion])

  useEffect(() => {
    if (!running) return
    // A paused beat resumes with the time it had left.
    const ms = remaining.current?.beat === beat ? remaining.current.ms : beats[beat].ms
    const started = performance.now()
    remaining.current = undefined
    const timeout = setTimeout(() => {
      if (beat === beats.length - 1) {
        setLoop((count) => count + 1)
        setPinned(undefined)
      }
      setBeat((beat + 1) % beats.length)
    }, ms)
    return () => {
      clearTimeout(timeout)
      const left = ms - (performance.now() - started)
      if (left > 40) remaining.current = { beat, ms: left }
    }
  }, [running, beat])

  const stage = beats[beat].stage
  const pane = pinned ?? beats[beat].pane
  const choose = (index: number) => {
    remaining.current = undefined
    setPinned(undefined)
    setMode('chosen')
    setBeat(stageEnds[index])
  }
  const toggle = () => {
    if (mode === 'tour') return setMode('paused')
    if (mode === 'chosen') {
      remaining.current = undefined
      setBeat((current) => current >= finalBeat ? 0 : current + 1)
    }
    setMode('tour')
  }

  const before = code.trim().split('\n')
  const after = fixedCode.trim().split('\n')
  const changed = before.filter((line, index) => line !== after[index]).length
  // Before the agent styles it, the plan card is the same markup without its class attributes.
  const styled = before.filter((line) => line.includes(' class="')).length
  const view = beat >= at.written ? 'applied' : beat >= at.diff ? 'diff' : 'draft'
  const draft = beat >= at.problems ? 'problems' : beat >= at.rule ? 'inspect' : beat === at.edit ? 'typing' : beat > at.edit ? 'styled' : 'plain'
  const panel = beat >= at.apply ? 'apply' : beat >= at.diff ? 'preview' : beat >= at.problems ? 'problems' : beat >= at.rule ? 'rule' : beat >= at.tokens ? 'tokens' : 'idle'
  const calling = [at.manifest, at.inspect, at.lint, at.preview, at.apply, at.relint].includes(beat)

  const entries: Entry[] = [
    { at: at.prompt, kind: 'user', text: $('Style the plan card with our spacing and color tokens.') },
    { at: at.reply, kind: 'agent', text: $('I will look up the spacing tokens in the project manifest first.') },
    { at: at.manifest, kind: 'call', id: 'manifest', done: at.tokens },
    { at: at.edit, kind: 'edit' },
    { at: at.inspect, kind: 'call', id: 'inspect', done: at.rule },
    { at: at.lint, kind: 'call', id: 'lint', done: at.problems },
    { at: at.preview, kind: 'call', id: 'preview', done: at.diff },
    { at: at.ask, kind: 'agent', text: $('The fix sorts the classes and removes mt-md, which mt-sm overrides. Apply it?') },
    { at: at.confirm, kind: 'user', text: $('Apply it.') },
    { at: at.apply, kind: 'call', id: 'apply', done: at.written },
    { at: at.relint, kind: 'call', id: 'relint', done: at.clean },
    { at: at.clean, kind: 'agent', text: $('Applied. {file} passes lint with no problems.').replace('{file}', file) }
  ]
  const shown = entries.filter((entry) => beat >= entry.at)
  const lastCall = shown.findLast((entry) => entry.kind === 'call')
  // The figure under the window plays each call as it runs and while its result lands, keyed by the call.
  const flight = !reduceMotion && mode === 'tour' ? shown.find((entry) => entry.kind === 'call' && (beat === entry.at || beat === entry.done)) : undefined
  const orbitCall = flight?.kind === 'call' ? { key: `${loop}-${flight.at}` } : undefined

  const results: Record<AgentSessionCallId, { summary: string, response: ReactNode, tone: 'ok' | 'warn' }> = {
    manifest: { summary: $('{count} tokens').replace('{count}', String(tokens.length)), response: <>{tokens[0].name} … {tokens[tokens.length - 1].name}</>, tone: 'ok' },
    inspect: {
      summary: inspection.matchStatus,
      response: inspection.declarations.map(({ property, value }) => <Fragment key={property}>{property}: <span className="white-space:nowrap">{value}</span></Fragment>),
      tone: 'ok'
    },
    lint: {
      summary: $('{count} problems').replace('{count}', String(agentSessionResults.lint.diagnostics)),
      response: $('{count} warnings, {fixable} fixable').replace('{count}', String(agentSessionResults.lint.warnings)).replace('{fixable}', String(agentSessionResults.lint.fixable)),
      tone: 'warn'
    },
    preview: { summary: $('1 file changed'), response: <>confirmToken <span className="home-agent-json-string">&quot;{shortToken(agentSessionCalls.apply.args.confirmToken as string)}&quot;</span></>, tone: 'ok' },
    apply: { summary: $('Applied'), response: $('Hash matched, file written'), tone: 'ok' },
    relint: { summary: $('No problems'), response: $('{count} problems').replace('{count}', '0'), tone: 'ok' }
  }

  // The file's state is a mark, not a word: a warning while it has problems, a check once it lints clean.
  const tone = draft === 'problems' && view === 'draft' ? 'warn' : beat >= at.clean ? 'ok' : undefined
  const statusMark = tone && (
    <span className={clsx('home-agent-file-status', `home-tone-${tone}`)}>
      {tone === 'warn' ? <IconAlertTriangle aria-hidden="true" {...icon} /> : <IconCircleCheck aria-hidden="true" {...icon} />}
    </span>
  )

  const tabs: { pane: Pane, label: ReactNode }[] = [
    { pane: 'chat', label: $('Session') },
    { pane: 'code', label: <>{file}{statusMark}</> },
    { pane: 'output', label: $('Output') }
  ]

  return (
    <div className="home-agent-scene">
    <div
      className="home-agent home-reveal-item"
      onBlur={(event) => !event.currentTarget.contains(event.relatedTarget) && setHeld(false)}
      onFocus={() => setHeld(true)}
      onPointerEnter={(event) => event.pointerType === 'mouse' && setHeld(true)}
      onPointerLeave={() => setHeld(false)}
      ref={ref}>
      <div className="home-agent-window" data-outro={beat === at.outro ? '' : undefined} data-pane={pane}>
        <div className="home-agent-bar home-agent-bar-chat">
          <span aria-hidden="true" className="home-agent-dots"><span /><span /><span /></span>
          <span className={clsx('home-agent-server home-status', calling && running && 'home-status-live')}>@master/css-mcp</span>
        </div>

        {/* The open file is a tab that joins the editor below it. */}
        <div className="home-agent-bar home-agent-bar-file">
          <span className="home-agent-file-tab"><IconFileCode aria-hidden="true" className="home-agent-file-icon" {...icon} />{file}{statusMark}</span>
        </div>

        {/* A narrow window shows one pane at a time behind the same folder tabs; they follow the session and let the reader choose. */}
        <div className="home-agent-bar home-agent-tabs">
          <span aria-hidden="true" className="home-agent-dots"><span /><span /><span /></span>
          <div aria-label={$('Panes')} className="home-agent-tab-list" role="group">
            {tabs.map((tab) => (
              <button aria-pressed={pane === tab.pane} className="home-agent-tab" key={tab.pane} onClick={() => setPinned(tab.pane)} type="button">
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="home-agent-chat home-agent-pane" data-active={pane === 'chat' ? '' : undefined}>
          <ol aria-label={$('Agent session')} className="home-agent-log" key={loop}>
            {shown.map((entry, index) => (
              <li className="home-agent-entry" key={index}>
                {/* A new speaker opens a turn with more room above it; the agent's calls and edits sit in its turn, under its text. */}
                <div className="home-agent-entry-inner" data-turn={index > 0 && (entry.kind === 'user' || shown[index - 1].kind === 'user') ? '' : undefined}>
                  {entry.kind === 'call'
                    ? <CallCard
                      expanded={entry === lastCall}
                      artwork={toolIcons[entry.id]}
                      id={entry.id}
                      result={beat >= entry.done ? results[entry.id] : undefined} />
                    : entry.kind === 'edit'
                      ? <EditRow file={file} label={$('Edit')} lines={styled} />
                      : <Message tone={entry.kind}><Stream text={entry.text} /></Message>}
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="home-agent-code home-agent-pane" data-active={pane === 'code' ? '' : undefined}>
          <div className="home-agent-code-stack" data-view={view}>
            <CodeView active={view === 'draft'} data-draft={draft}>
              {before.map((line, index) => (
                <CodeLine
                  key={index}
                  line={line}
                  number={index + 1}
                  marks={{ [agentSessionCalls.inspect.args.className as string]: 'home-agent-inspected', 'mt-md': 'home-agent-conflict' }}
                  style={{ '--home-agent-index': index } as CSSProperties}
                  valueClassName="home-agent-squiggle" />
              ))}
              <div aria-hidden="true" className="home-agent-hover">
                <RuleCode inspection={inspection} />
              </div>
            </CodeView>
            <CodeView active={view === 'diff'}>
              {before.flatMap((line, index) => line === after[index]
                ? [<CodeLine key={index} line={line} number={index + 1} />]
                : [
                  <CodeLine key={`-${index}`} line={line} marks={{ 'mt-md': 'home-agent-removed-class' }} sign="-" />,
                  <CodeLine key={`+${index}`} line={after[index]} number={index + 1} sign="+" />
                ])}
            </CodeView>
            <CodeView active={view === 'applied'}>
              {after.map((line, index) => <CodeLine changed={line !== before[index]} key={index} line={line} number={index + 1} />)}
            </CodeView>
          </div>
        </div>

        <div className="home-agent-pane home-agent-panel" data-active={pane === 'output' ? '' : undefined} data-panel={panel}>
          {/* Each result arrives along the panel's top seam, the way its request left along the call's. */}
          {panel !== 'idle' && mode === 'tour' && <span aria-hidden="true" className="home-agent-panel-signal" key={`${loop}-${panel}`} />}
          <div className="home-agent-panel-header">
            <code className="home-agent-panel-tool">{panel === 'idle' ? ' ' : agentSessionCalls[panelCall(panel)].name}</code>
          </div>
          <div className="home-agent-panel-body">
            {/* Before the first result, the panel is a reserved slot. */}
            <PanelView active={panel === 'idle'} className="home-agent-panel-idle home-hatch" />
            <PanelView active={panel === 'tokens'}>
              <ul className="home-agent-tokens">
                {tokens.map((token) => (
                  <li className="home-agent-token" key={token.name} style={{ '--home-agent-token': Math.min(parseFloat(token.value) / parseFloat(tokens[tokens.length - 1].value), 1) } as CSSProperties}>
                    <code>{token.name}</code>
                    <span className="home-agent-token-value">{token.value}</span>
                    <span aria-hidden="true" className="home-agent-token-bar" />
                  </li>
                ))}
              </ul>
            </PanelView>
            <PanelView active={panel === 'rule'}>
              <dl className="home-agent-facts">
                <div>
                  <dt>matchStatus</dt>
                  <dd><code>{inspection.matchStatus}</code></dd>
                </div>
                <div>
                  <dt>cssSyntaxStatus</dt>
                  <dd><code>{inspection.cssSyntaxStatus}</code></dd>
                </div>
                <div>
                  <dt>{$('Layer')}</dt>
                  <dd><code>@layer {inspection.layer}</code></dd>
                </div>
                <div>
                  <dt>{$('Token')}</dt>
                  <dd>
                    <code className="home-agent-rule-property">--{inspection.variable.name}</code>
                    {/* Break only between arguments, never inside a var(). */}
                    <code>{inspection.variable.value.split(', ').map((part, index, parts) => <Fragment key={index}><span className="white-space:nowrap">{part}{index < parts.length - 1 ? ',' : ''}</span>{index < parts.length - 1 ? ' ' : ''}</Fragment>)}</code>
                  </dd>
                </div>
              </dl>
            </PanelView>
            <PanelView active={panel === 'problems'}>
              <ul className="home-agent-problems">
                {problems.map((problem) => (
                  <li className="home-agent-problem" key={problem.location}>
                    <IconAlertTriangle aria-hidden="true" className="home-tone-warn" {...icon} />
                    <span className="min-width:0">
                      <span className="home-agent-problem-message">{keepWords(problem.message)}</span>
                      <span className="home-agent-problem-meta">{problem.source.replace('@master/css/', '')} · {problem.location.replace(`${file}:`, $('Ln') + ' ')}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </PanelView>
            <PanelView active={panel === 'preview'}>
              <dl className="home-agent-facts">
                <div>
                  <dt>{$('Changes')}</dt>
                  <dd><code>{file}</code><Diffstat added={changed} removed={changed} /></dd>
                </div>
                <div>
                  <dt>confirmToken</dt>
                  <dd><code className="home-agent-token-chip">{shortToken(agentSessionCalls.apply.args.confirmToken as string)}</code><span className="home-agent-fact-note">{$('Valid for {count} minutes').replace('{count}', String(agentSessionResults.previewMinutes))}</span></dd>
                </div>
              </dl>
            </PanelView>
            <PanelView active={panel === 'apply'}>
              <dl className="home-agent-facts home-agent-hashes" data-hashing={beat === at.apply ? '' : undefined} data-matched={beat >= at.written ? '' : undefined}>
                <div>
                  <dt>{$('Preview made from')}</dt>
                  <dd><code>sha256 <span className="home-agent-hash">{shortHash(agentSessionResults.beforeHash)}</span></code></dd>
                </div>
                <div>
                  <dt>{$('File on disk')}</dt>
                  <dd>
                    <code>sha256 <Hash scrambling={beat === at.apply && running} value={agentSessionResults.beforeHash} /></code>
                    {/* The moment the digests match: a seal in gold that settles to the ok tone. */}
                    <span className={clsx('home-agent-match', beat >= at.written && 'home-agent-match-shown')}><IconShieldCheck aria-hidden="true" size={16} stroke={1.75} /></span>
                  </dd>
                </div>
                <div className={clsx('home-agent-fact-later', beat >= at.written && 'home-agent-fact-shown')}>
                  <dt>{$('Written')}</dt>
                  <dd><code>sha256 {shortHash(agentSessionResults.afterHash)}</code></dd>
                </div>
              </dl>
            </PanelView>
          </div>
        </div>

        <div className="home-agent-steps">
          {!reduceMotion && (
            <button aria-label={mode === 'tour' ? $('Pause the session') : $('Play the session')} className="home-agent-play" onClick={toggle} type="button">
              {mode === 'tour' ? <IconPlayerPauseFilled aria-hidden="true" size={12} /> : <IconPlayerPlayFilled aria-hidden="true" size={12} />}
            </button>
          )}
          <ol aria-label={$('Session steps')} className="home-agent-step-list">
            {agentSessionStages.map((name, index) => {
              const duration = beats.filter((item, beatIndex) => item.stage === index && beatIndex !== at.outro).reduce((total, item) => total + item.ms, 0)
              // The first tour starts partway into a step; that step's fill starts there too.
              const elapsed = loop === 0 && index === beats[firstBeat].stage ? beats.slice(0, firstBeat).filter((item) => item.stage === index).reduce((total, item) => total + item.ms, 0) : 0
              return (
                <li key={name}>
                  <button
                    aria-current={index === stage ? 'step' : undefined}
                    className="home-agent-step"
                    data-state={index < stage || (index === stage && mode === 'chosen') ? 'done' : index === stage ? 'current' : undefined}
                    onClick={() => choose(index)}
                    type="button">
                    <span className="home-agent-step-name">{$(name)}</span>
                    <span aria-hidden="true" className="home-agent-step-track">
                      {index === stage && mode !== 'chosen' && (
                        <span
                          className="home-agent-step-fill"
                          key={`${loop}-${stage}`}
                          style={{ animationDuration: `${duration}ms`, animationDelay: `-${elapsed}ms`, animationPlayState: running ? 'running' : 'paused' }} />
                      )}
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
        </div>
      </div>
    </div>
    {/* Tucked under the window, open on the page: the server the session calls, joined to it by the beam its calls travel. */}
    <AgentsOrbit call={orbitCall} classRows={classRows} live={flight?.at === beat} />
    </div>
  )
}

/** The call whose result the output panel shows. */
function panelCall(panel: string): AgentSessionCallId {
  if (panel === 'tokens') return 'manifest'
  if (panel === 'rule') return 'inspect'
  if (panel === 'problems') return 'lint'
  if (panel === 'preview') return 'preview'
  return 'apply'
}

function shortHash(value: string) {
  return `${value.slice(0, 8)}…${value.slice(-4)}`
}

function shortToken(value: string) {
  return `${value.slice(0, 6)}…${value.slice(-4)}`
}

function Diffstat({ added, removed }: { added: number, removed: number }) {
  return <span className="home-agent-diffstat"><span className="home-tone-ok">+{added}</span> <span className="home-tone-error">−{removed}</span></span>
}

/** While the server reads the file, the digest scrambles, then settles on the value it computed. */
function Hash({ scrambling, value }: { scrambling: boolean, value: string }) {
  const [shown, setShown] = useState(value)
  useEffect(() => {
    if (!scrambling) return setShown(value)
    const interval = setInterval(() => setShown(Array.from(value, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('')), 70)
    return () => clearInterval(interval)
  }, [scrambling, value])
  return <span className="home-agent-hash home-agent-hash-live">{shortHash(shown)}</span>
}

function CodeView({ active, children, ...props }: { active: boolean, children: ReactNode, 'data-draft'?: string }) {
  return <div aria-hidden={!active} className="home-agent-code-view" data-active={active ? '' : undefined} {...props}>{children}</div>
}

function PanelView({ active, children, className }: { active: boolean, children?: ReactNode, className?: string }) {
  return <div aria-hidden={!active} className={clsx('home-agent-panel-view', className)} data-active={active ? '' : undefined}>{children}</div>
}

function RuleCode({ inspection }: { inspection: AgentSessionInspection }) {
  return (
    <pre className="home-agent-rule">
      <span className="home-agent-rule-selector">{inspection.selector}</span> {'{'}{'\n'}
      {inspection.declarations.map(({ property, value }) => (
        <Fragment key={property}>{'  '}<span className="home-agent-rule-property">{property}</span>: <span className="white-space:nowrap">{value};</span>{'\n'}</Fragment>
      ))}
      {'}'}
    </pre>
  )
}

/** The agent speaks beside a sparkle on ink; the reader's own messages sit on the right beside a person. */
function Message({ children, tone }: { children: ReactNode, tone: 'agent' | 'user' }) {
  const Avatar = tone === 'agent' ? IconSparkles : IconUser
  return (
    <div className={clsx('home-agent-message', `home-agent-message-${tone}`)}>
      <span aria-hidden="true" className="home-agent-avatar"><Avatar {...icon} /></span>
      <p>{children}</p>
    </div>
  )
}

/** Text arrives a word at a time, the way an agent streams its reply. Han text arrives a character at a time. */
function Stream({ text }: { text: string }) {
  const parts = text.match(/[　-鿿＀-￯]|[^\s　-鿿＀-￯]+|\s+/g) ?? [text]
  let index = 0
  return (
    <>
      {parts.map((part, key) => /^\s+$/.test(part)
        ? part
        : <span className="home-agent-word" key={key} style={{ '--home-agent-word': index++ } as CSSProperties}>{part}</span>)}
    </>
  )
}

/** The agent styles the card with its own edit tool; the MCP server never writes without a preview. */
function EditRow({ file, label, lines }: { file: string, label: string, lines: number }) {
  return (
    <div className="home-agent-edit">
      <span aria-hidden="true" className="home-agent-edit-icon"><IconPencil {...icon} /></span>
      <span>{label}</span>
      <code>{file}</code>
      <span className="home-agent-edit-count"><Diffstat added={lines} removed={lines} /></span>
    </div>
  )
}

/** A `tools/call` request to the MCP server and, once it returns, its result. */
function CallCard({ artwork, expanded, id, result }: {
  artwork: ReactNode
  expanded: boolean
  id: AgentSessionCallId
  result?: { summary: string, response: ReactNode, tone: 'ok' | 'warn' }
}) {
  const call = agentSessionCalls[id]
  return (
    <div className="home-agent-call" data-expanded={expanded ? '' : undefined} data-state={result ? 'done' : 'running'}>
      <div className="home-agent-call-header">
        <span aria-hidden="true" className="home-agent-call-icon">{artwork}</span>
        <code className="home-agent-call-name">{call.name}</code>
        {/* A settled call keeps its result as one word; an open call shows the result in full below instead. */}
        {result && <span className={clsx('home-agent-call-summary', result.tone === 'warn' && 'home-tone-warn')}>{result.summary}</span>}
        <span aria-hidden="true" className="home-agent-call-status">
          {result
            ? result.tone === 'warn'
              ? <IconAlertTriangle className="home-tone-warn" {...icon} />
              : <IconCircleCheck className="home-tone-ok" {...icon} />
            : <IconLoader2 className="home-spin" {...icon} />}
        </span>
      </div>
      <div className="home-agent-call-body">
        <div className="home-agent-call-inner">
          <div className="home-agent-call-detail">
            <code className="home-agent-call-line home-agent-call-request">
              <span aria-hidden="true" className="home-agent-call-arrow">→</span>
              <Json value={call.args} />
            </code>
            <code className="home-agent-call-line home-agent-call-response">
              <span aria-hidden="true" className="home-agent-call-arrow">←</span>
              <span>{result?.response ?? <span className="home-agent-pending"><span /><span /><span /></span>}</span>
            </code>
          </div>
        </div>
      </div>
    </div>
  )
}

function Json({ value }: { value: Record<string, string | string[]> }) {
  const entries = Object.entries(value)
  return (
    <span className="home-agent-json">
      {'{ '}
      {entries.map(([key, item], index) => (
        <Fragment key={key}>
          <span className="home-agent-json-key">&quot;{key}&quot;</span>: {Array.isArray(item)
            ? <>[{item.map((part, partIndex) => <Fragment key={part}>{partIndex ? ', ' : ''}<span className="home-agent-json-string">&quot;{part}&quot;</span></Fragment>)}]</>
            : <span className="home-agent-json-string">&quot;{key === 'confirmToken' ? shortToken(item) : item}&quot;</span>}
          {index < entries.length - 1 ? ', ' : ''}
        </Fragment>
      ))}
      {' }'}
    </span>
  )
}

/**
 * One line of markup, highlighted by hand so diagnostics, inspections and diffs can mark single
 * classes. The class attribute is its own span, so the unstyled card can hide it and the edit can
 * type it in.
 */
function CodeLine({ changed, line, marks, number, sign, style, valueClassName }: {
  changed?: boolean
  line: string
  marks?: Record<string, string>
  number?: number
  sign?: '+' | '-'
  style?: CSSProperties
  valueClassName?: string
}) {
  const match = line.match(/^(\s*)<(\w+) class="([^"]*)">(.*)$/)
  const closing = match?.[4].match(/<\/\w+>$/)?.[0]
  return (
    <div className={clsx('home-agent-line', sign === '+' && 'home-agent-line-added', sign === '-' && 'home-agent-line-removed', changed && 'home-agent-line-changed')} style={style}>
      <span className="home-agent-gutter">{number}</span>
      <span className="home-agent-sign">{sign === '-' ? '−' : sign}</span>
      <span className="home-agent-text">
        {match
          ? <>
            {match[1]}<span className="home-code-tag">&lt;{match[2]}</span><span className="home-agent-attr"> <span className="home-code-attr">class</span>=<span className="home-code-string">&quot;<span className={valueClassName}>
              {match[3].split(' ').map((className, index) => (
                <Fragment key={className}>{index ? ' ' : ''}<span className={clsx('home-agent-class', marks?.[className])}>{className}</span></Fragment>
              ))}
            </span>&quot;</span></span><span className="home-code-tag">&gt;</span>{closing ? match[4].slice(0, -closing.length) : match[4]}{closing && <span className="home-code-tag">{closing}</span>}
          </>
          : <span className="home-code-tag">{line}</span>}
      </span>
    </div>
  )
}

/** Keeps each class-like word whole, so a wrapped message never breaks a class at its hyphen. */
function keepWords(text: string) {
  return text.split(' ').map((word, index) => (
    <Fragment key={index}>{index ? ' ' : ''}{/[-:]/.test(word) ? <span className="home-agent-word">{word}</span> : word}</Fragment>
  ))
}
