<script lang="ts" module>
  import claudeLogo from '~/site/assets/images/home/clients/claude.svg?raw'
  import { agentSessionCalls, agentSessionResults, agentSessionStages, type AgentSessionCallId } from './agents-content'

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

  /** Claude's mark at the avatar's size. */
  const claudeAvatar = claudeLogo.replace('<svg', '<svg height="16" width="16"')

  export interface AgentSessionInspection {
    selector: string
    declarations: { property: string, value: string }[]
    matchStatus: string
    cssSyntaxStatus: string
    layer: string
    variable: { name: string, value: string }
  }

  /** The call whose result the output panel shows. */
  function panelCall(panel: string): AgentSessionCallId {
    if (panel === 'tokens') return 'manifest'
    if (panel === 'rule') return 'inspect'
    if (panel === 'problems') return 'lint'
    if (panel === 'preview') return 'preview'
    if (panel === 'clean') return 'relint'
    return 'apply'
  }

  function shortHash(value: string) {
    return `${value.slice(0, 8)}…${value.slice(-4)}`
  }

  function shortToken(value: string) {
    return `${value.slice(0, 6)}…${value.slice(-4)}`
  }

  /** Text arrives a word at a time, the way an agent streams its reply. Han text arrives a character at a time. */
  function streamParts(text: string) {
    const parts = text.match(/[　-鿿＀-￯]|[^\s　-鿿＀-￯]+|\s+/g) ?? [text]
    let index = 0
    return parts.map((part) => /^\s+$/.test(part) ? { part } : { part, word: index++ })
  }

  /** One line of markup, split so diagnostics, inspections and diffs can mark single classes. */
  function parseLine(line: string) {
    const match = line.match(/^(\s*)<(\w+) class="([^"]*)">(.*)$/)
    const closing = match?.[4].match(/<\/\w+>$/)?.[0]
    return { match, closing }
  }

  /** A bare tag such as `</article>`. */
  function parseTag(text: string) {
    return text.match(/^(\s*)(<\/?)(\w+)(\s*\/?>)$/)
  }
</script>

<script lang="ts">
  import './home-window-surface.css'
  import './home-code-colors.css'
  import { onMount, type Snippet } from 'svelte'
  import IconAlertTriangle from '@tabler/icons-svelte-runes/icons/alert-triangle'
  import IconCircleCheck from '@tabler/icons-svelte-runes/icons/circle-check'
  import IconFileCode from '@tabler/icons-svelte-runes/icons/file-code'
  import IconLoader2 from '@tabler/icons-svelte-runes/icons/loader-2'
  import IconPlayerPauseFilled from '@tabler/icons-svelte-runes/icons/player-pause-filled'
  import IconPlayerPlayFilled from '@tabler/icons-svelte-runes/icons/player-play-filled'
  import IconShieldCheck from '@tabler/icons-svelte-runes/icons/shield-check'
  import IconTerminal2 from '@tabler/icons-svelte-runes/icons/terminal-2'
  import Image from '@master/internal-site/components/Image.svelte'
  import aronImage from '@master/internal-site/assets/images/authors/aron.jpg'
  import { getSite } from '@master/internal-site/site'
  import AgentsOrbit from './AgentsFigures.svelte'
  import type { HomeCodeWindowProblem } from './home-content'
  import { pointerMoved } from './pointer-motion'

  interface Props {
    /** Astro represents the named slots as children during type checking. */
    children?: Snippet
    /** Decorative themed artwork slots rendered on the server: the edit row's, and each call's. */
    editIcon?: Snippet
    manifestIcon?: Snippet
    inspectIcon?: Snippet
    lintIcon?: Snippet
    previewIcon?: Snippet
    applyIcon?: Snippet
    relintIcon?: Snippet
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

  /**
   * An agent session over the Master CSS MCP server: the agent reads the spacing tokens, styles the
   * plan card, inspects a class, lints its own draft, previews the fix as a diff with a confirmation
   * token and applies it after the server checks the file has not changed. The transcript, the file
   * and the server's output play in step; the step bar pauses the session or opens any step.
   */
  let { classRows, code, editIcon, manifestIcon, inspectIcon, lintIcon, previewIcon, applyIcon, relintIcon, file, fixedCode, inspection, problems, tokens }: Props = $props()
  const { t } = getSite()
  const toolIcons = $derived<Record<AgentSessionCallId, Snippet | undefined>>({ manifest: manifestIcon, inspect: inspectIcon, lint: lintIcon, preview: previewIcon, apply: applyIcon, relint: relintIcon })

  // The server renders the finished session. Once the page can play it, the tour starts on a frame
  // that already has a conversation, a file and a result in it (firstBeat); later loops start from the prompt.
  let beat = $state(finalBeat)
  let mode = $state<Mode>('chosen')
  let hovered = $state(false)
  let focused = $state(false)
  let visible = $state(true)
  let loop = $state(0)
  let pinned = $state<Pane>()
  let inView = $state(false)
  // Read after hydration, so the first render matches the server's.
  let reduceMotion = $state(false)
  let root = $state<HTMLDivElement>()
  const running = $derived(mode === 'tour' && inView && visible && !hovered && !focused && !reduceMotion)
  let remaining: { beat: number, ms: number } | undefined

  onMount(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    beat = firstBeat
    mode = 'tour'
  })

  onMount(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => { reduceMotion = query.matches }
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  })

  onMount(() => {
    const update = () => { visible = !document.hidden }
    update()
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  })

  $effect(() => {
    if (!root) return
    // Notifications batch while layout settles; the last entry is the current state.
    const observer = new IntersectionObserver((entries) => { const entry = entries[entries.length - 1]; inView = entry.isIntersecting }, { threshold: 0.25 })
    observer.observe(root)
    return () => observer.disconnect()
  })

  // Reduced motion shows the finished session, with every step still open to choose.
  $effect(() => {
    if (!reduceMotion) return
    mode = 'chosen'
    beat = finalBeat
  })

  $effect(() => {
    if (!running) return
    const current = beat
    // A paused beat resumes with the time it had left.
    const ms = remaining?.beat === current ? remaining.ms : beats[current].ms
    const started = performance.now()
    remaining = undefined
    const timeout = setTimeout(() => {
      if (current === beats.length - 1) {
        loop += 1
        pinned = undefined
      }
      beat = (current + 1) % beats.length
    }, ms)
    return () => {
      clearTimeout(timeout)
      const left = ms - (performance.now() - started)
      if (left > 40) remaining = { beat: current, ms: left }
    }
  })

  const stage = $derived(beats[beat].stage)
  const pane = $derived(pinned ?? beats[beat].pane)
  const choose = (index: number) => {
    remaining = undefined
    pinned = undefined
    mode = 'chosen'
    beat = stageEnds[index]
  }
  // Choosing a pane is an explicit reading hold, including on touch browsers without hover.
  const pinPane = (next: Pane) => {
    pinned = next
    if (mode === 'tour') mode = 'paused'
  }
  const toggle = () => {
    if (mode === 'tour') {
      mode = 'paused'
      return
    }
    if (mode === 'chosen') {
      remaining = undefined
      beat = beat >= finalBeat ? 0 : beat + 1
    }
    mode = 'tour'
  }

  const before = $derived(code.trim().split('\n'))
  const after = $derived(fixedCode.trim().split('\n'))
  const changed = $derived(before.filter((line, index) => line !== after[index]).length)
  // Before the agent styles it, the plan card is the same markup without its class attributes.
  const styled = $derived(before.filter((line) => line.includes(' class="')).length)
  const view = $derived(beat >= at.written ? 'applied' : beat >= at.diff ? 'diff' : 'draft')
  const draft = $derived(beat >= at.problems ? 'problems' : beat >= at.rule ? 'inspect' : beat === at.edit ? 'typing' : beat > at.edit ? 'styled' : 'plain')
  const panel = $derived(beat >= at.relint ? 'clean' : beat >= at.apply ? 'apply' : beat >= at.diff ? 'preview' : beat >= at.problems ? 'problems' : beat >= at.rule ? 'rule' : beat >= at.tokens ? 'tokens' : 'idle')
  const calling = $derived([at.manifest, at.inspect, at.lint, at.preview, at.apply, at.relint].includes(beat))

  const entries: Entry[] = $derived([
    { at: at.prompt, kind: 'user', text: t('Style the plan card with our spacing and color tokens.') },
    { at: at.reply, kind: 'agent', text: t('I will look up the spacing tokens in the project manifest first.') },
    { at: at.manifest, kind: 'call', id: 'manifest', done: at.tokens },
    { at: at.edit, kind: 'edit' },
    { at: at.inspect, kind: 'call', id: 'inspect', done: at.rule },
    { at: at.lint, kind: 'call', id: 'lint', done: at.problems },
    { at: at.preview, kind: 'call', id: 'preview', done: at.diff },
    { at: at.ask, kind: 'agent', text: t('The fix sorts the classes and removes mt-md, which mt-sm overrides. Apply it?') },
    { at: at.confirm, kind: 'user', text: t('Apply it.') },
    { at: at.apply, kind: 'call', id: 'apply', done: at.written },
    { at: at.relint, kind: 'call', id: 'relint', done: at.clean },
    { at: at.clean, kind: 'agent', text: t('Applied. {file} passes lint with no problems.').replace('{file}', file) }
  ])
  const shown = $derived(entries.filter((entry) => beat >= entry.at))
  const lastCall = $derived(shown.findLast((entry) => entry.kind === 'call'))
  // The figure under the window plays each call as it runs and while its result lands, keyed by the call.
  const flight = $derived(!reduceMotion && mode === 'tour' ? shown.find((entry) => entry.kind === 'call' && (beat === entry.at || beat === entry.done)) : undefined)
  const orbitCall = $derived(flight?.kind === 'call' ? { key: `${loop}-${flight.at}`, response: beat === flight.done } : undefined)

  /** Each call's one-word summary and tone; `response` below renders its full result. */
  const results: Record<AgentSessionCallId, { summary: string, tone: 'ok' | 'warn' }> = $derived({
    manifest: { summary: t('{count} tokens').replace('{count}', String(tokens.length)), tone: 'ok' },
    inspect: { summary: inspection.matchStatus, tone: 'ok' },
    lint: { summary: t('{count} problems').replace('{count}', String(agentSessionResults.lint.diagnostics)), tone: 'warn' },
    preview: { summary: t('1 file changed'), tone: 'ok' },
    apply: { summary: t('Applied'), tone: 'ok' },
    relint: { summary: t('No problems'), tone: 'ok' }
  })

  // The file's state is a mark, not a word: a warning while it has problems, a check once it lints clean.
  const tone = $derived(draft === 'problems' && view === 'draft' ? 'warn' : beat >= at.clean ? 'ok' : undefined)

  const tabs: { pane: Pane, label: string }[] = $derived([
    { pane: 'chat', label: t('Session') },
    { pane: 'code', label: file },
    { pane: 'output', label: t('Output') }
  ])

  /** While the server reads the file, the digest scrambles, then settles on the value it computed. */
  const scrambling = $derived(beat === at.apply && running)
  let hash = $state<string>(agentSessionResults.beforeHash)
  $effect(() => {
    const value = agentSessionResults.beforeHash
    if (!scrambling) {
      hash = value
      return
    }
    const interval = setInterval(() => { hash = Array.from(value, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('') }, 70)
    return () => clearInterval(interval)
  })

  const variableParts = $derived(inspection.variable.value.split(', '))
  const conflictMarks = { [agentSessionCalls.inspect.args.className as string]: 'home-agent-inspected', 'mt-md': 'home-agent-conflict' }
  const removedMarks = { 'mt-md': 'home-agent-removed-class' }
</script>

{#snippet statusMark()}
  {#if tone}<span class={['home-agent-file-status', ({ ok: 'home-tone-ok', warn: 'home-tone-warn', error: 'home-tone-error', info: 'home-tone-info' })[tone]]}>{#if tone === 'warn'}<IconAlertTriangle aria-hidden="true" {...icon} />{:else}<IconCircleCheck aria-hidden="true" {...icon} />{/if}</span>{/if}
{/snippet}

{#snippet diffstat(added: number, removed: number)}
  <span class="home-agent-diffstat"><span class="home-tone-ok">+{added}</span>{' '}<span class="home-tone-error">−{removed}</span></span>
{/snippet}

<!-- A bare tag such as `</article>`: brackets read as punctuation and the name as the tag, as in highlighted docs code. -->
{#snippet markupTag(text: string)}
  {@const tag = parseTag(text)}
  {#if tag}{tag[1]}<span class="home-code-punct">{tag[2]}</span><span class="home-code-tag">{tag[3]}</span><span class="home-code-punct">{tag[4]}</span>{:else}<span class="home-code-tag">{text}</span>{/if}
{/snippet}

<!--
  One line of markup, highlighted by hand so diagnostics, inspections and diffs can mark single
  classes. The class attribute is its own span, so the unstyled card can hide it and the edit can
  type it in.
-->
{#snippet codeLine({ changed: lineChanged, line, marks, number, sign, index, valueClass }: { changed?: boolean, line: string, marks?: Record<string, string>, number?: number, sign?: '+' | '-', index?: number, valueClass?: string })}
  {@const { match, closing } = parseLine(line)}
  <div class={['home-agent-line', sign === '+' && 'home-agent-line-added', sign === '-' && 'home-agent-line-removed', lineChanged && 'home-agent-line-changed']} style:--home-agent-index={index}><span class="home-agent-gutter">{number}</span><span class="home-agent-sign">{sign === '-' ? '−' : sign}</span><span class="home-agent-text">{#if match}{match[1]}<span class="home-code-punct">&lt;</span><span class="home-code-tag">{match[2]}</span><span class="home-agent-attr">{' '}<span class="home-code-attr">class</span><span class="home-code-punct">=</span><span class="home-code-string">&quot;<span class={valueClass}>{#each match[3].split(' ') as name, nameIndex}{nameIndex ? ' ' : ''}<span class={['home-agent-class', marks?.[name]]}>{name}</span>{/each}</span>&quot;</span></span><span class="home-code-punct">&gt;</span>{closing ? match[4].slice(0, -closing.length) : match[4]}{#if closing}{@render markupTag(closing)}{/if}{:else}{@render markupTag(line)}{/if}</span></div>
{/snippet}

{#snippet ruleCode()}
  <pre class="home-agent-rule"><span class="home-agent-rule-selector">{inspection.selector}</span> {'{'}{'\n'}{#each inspection.declarations as { property, value } (property)}{'  '}<span class="home-agent-rule-property">{property}</span>{': '}<span class="home-agent-rule-value">{value};</span>{'\n'}{/each}}</pre>
{/snippet}

<!-- Claude speaks on the left; Aron's messages and portrait sit on the right. -->
{#snippet message(text: string, speaker: 'agent' | 'user')}
  <div class={['home-agent-message', ({ agent: 'home-agent-message-agent', user: 'home-agent-message-user' })[speaker]]}><span aria-hidden="true" class="home-agent-avatar">{#if speaker === 'agent'}{@html claudeAvatar}{:else}<Image alt="" height={24} src={aronImage} width={24} />{/if}</span><p>{#each streamParts(text) as { part, word }, key (key)}{#if word === undefined}{part}{:else}<span class="home-agent-word" style:--home-agent-word={word}>{part}</span>{/if}{/each}</p></div>
{/snippet}

<!-- The agent styles the card with its own edit tool; the MCP server never writes without a preview. -->
{#snippet editRow()}
  <div class="home-agent-edit"><span aria-hidden="true" class="home-agent-edit-icon">{@render editIcon?.()}</span><span>{t('Edit')}</span><code>{file}</code><span class="home-agent-edit-count">{@render diffstat(styled, styled)}</span></div>
{/snippet}

{#snippet json(value: Record<string, string | string[]>)}
  {@const items = Object.entries(value)}
  <span class="home-agent-json">{'{ '}{#each items as [key, item], index (key)}<span class="home-agent-json-key">&quot;{key}&quot;</span>{': '}{#if Array.isArray(item)}[{#each item as part, partIndex}{partIndex ? ', ' : ''}<span class="home-agent-json-string">&quot;{part}&quot;</span>{/each}]{:else}<span class="home-agent-json-string">&quot;{key === 'confirmToken' ? shortToken(item) : item}&quot;</span>{/if}{index < items.length - 1 ? ', ' : ''}{/each}{' }'}</span>
{/snippet}

<!-- Each call's full result. -->
{#snippet response(id: AgentSessionCallId)}
  {#if id === 'manifest'}{tokens[0].name} … {tokens[tokens.length - 1].name}{:else if id === 'inspect'}{#each inspection.declarations as { property, value } (property)}{property}{': '}<span class="whitespace-nowrap">{value}</span>{/each}{:else if id === 'lint'}{t('{count} warnings, {fixable} fixable').replace('{count}', String(agentSessionResults.lint.warnings)).replace('{fixable}', String(agentSessionResults.lint.fixable))}{:else if id === 'preview'}confirmToken{' '}<span class="home-agent-json-string">&quot;{shortToken(agentSessionCalls.apply.args.confirmToken as string)}&quot;</span>{:else if id === 'apply'}{t('Hash matched, file written')}{:else}{t('{count} problems').replace('{count}', String(agentSessionResults.relint.diagnostics))}{/if}
{/snippet}

<!-- A `tools/call` request to the MCP server and, once it returns, its result. -->
{#snippet callCard(id: AgentSessionCallId, expanded: boolean, done: boolean)}
  {@const call = agentSessionCalls[id]}
  {@const result = done ? results[id] : undefined}
  {@const artwork = toolIcons[id]}
  <div class="home-agent-call" data-expanded={expanded ? '' : undefined} data-state={result ? 'done' : 'running'}>
    <div class="home-agent-call-header">
      <span aria-hidden="true" class="home-agent-call-icon">{@render artwork?.()}</span><code class="home-agent-call-name">{call.name}</code>
      <!-- A settled call keeps its result as one word; an open call shows the result in full below instead. -->
      {#if result}<span class={['home-agent-call-summary', result.tone === 'warn' && 'home-tone-warn']}>{result.summary}</span>{/if}<span aria-hidden="true" class="home-agent-call-status">{#if result}{#if result.tone === 'warn'}<IconAlertTriangle class="home-tone-warn" {...icon} />{:else}<IconCircleCheck class="home-tone-ok" {...icon} />{/if}{:else}<IconLoader2 class="home-spin" {...icon} />{/if}</span>
    </div>
    <div class="home-agent-call-body">
      <div class="home-agent-call-inner">
        <div class="home-agent-call-detail">
          <code class="home-agent-call-line home-agent-call-request"><span aria-hidden="true" class="home-agent-call-arrow">→</span>{@render json(call.args)}</code>
          <code class="home-agent-call-line home-agent-call-response"><span aria-hidden="true" class="home-agent-call-arrow">←</span><span>{#if result}{@render response(id)}{:else}<span class="home-agent-pending"><span></span><span></span><span></span></span>{/if}</span></code>
        </div>
      </div>
    </div>
  </div>
{/snippet}

<div class="home-agent-scene" data-mode={mode} data-paused={!running ? '' : undefined}>
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    bind:this={root}
    class="home-agent home-reveal-item home-window-surface"
    onfocusout={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) focused = false
    }}
    onfocusin={(event) => { focused = !(event.target instanceof Element && event.target.closest('.home-agent-play')) }}
    onpointermove={(event) => {
      // Only a pointer that moves over the window holds it; content scrolled under a resting pointer does not,
      // including the motionless pointermove WebKit sends once scrolling stops.
      if (event.pointerType === 'mouse' && pointerMoved(event)) hovered = !(event.target instanceof Element && event.target.closest('.home-agent-play'))
    }}
    onpointerleave={() => { hovered = false }}>
    <!-- The page lamp writes its light onto this edge before or after hydration. -->
    <span aria-hidden="true" class="home-edge-light home-lit"></span>
    <div class="home-agent-window" data-outro={beat === at.outro ? '' : undefined} data-pane={pane}>
      <div class="home-agent-bar home-agent-bar-chat"><span aria-hidden="true" class="home-agent-dots"><span></span><span></span><span></span></span><span class="home-agent-bar-label">{t('Session')}</span><span class={['home-agent-server home-status', calling && running && 'home-status-live']}>@master/css-mcp</span></div>

      <!-- The open file is a tab that joins the editor below it. -->
      <div class="home-agent-bar home-agent-bar-file"><span class="home-agent-file-tab"><IconFileCode aria-hidden="true" class="home-agent-file-icon" {...icon} />{file}{@render statusMark()}</span></div>

      <!-- A narrow window shows one pane at a time behind the same folder tabs; they follow the session and let the reader choose. -->
      <div class="home-agent-bar home-agent-tabs">
        <span aria-hidden="true" class="home-agent-dots"><span></span><span></span><span></span></span>
        <div aria-label={t('Panes')} class="home-agent-tab-list" role="group">
          {#each tabs as tab (tab.pane)}
            <button aria-pressed={pane === tab.pane} class="home-agent-tab" onclick={() => pinPane(tab.pane)} type="button"><span class="home-agent-tab-label">{tab.label}</span>{#if tab.pane === 'code'}{@render statusMark()}{/if}</button>
          {/each}
        </div>
      </div>

      <div class="home-agent-chat home-agent-pane" data-active={pane === 'chat' ? '' : undefined}>
        {#key loop}
          <ol aria-label={t('Agent session')} class="home-agent-log">
            {#each shown as entry, index (index)}
              <li class="home-agent-entry">
                <!-- A new speaker opens a turn with more room above it; the agent's calls and edits sit in its turn, under its text. -->
                <div class="home-agent-entry-inner" data-turn={index > 0 && (entry.kind === 'user' || shown[index - 1].kind === 'user') ? '' : undefined}>
                  {#if entry.kind === 'call'}
                    {@render callCard(entry.id, entry === lastCall, beat >= entry.done)}
                  {:else if entry.kind === 'edit'}
                    {@render editRow()}
                  {:else}
                    {@render message(entry.text, entry.kind)}
                  {/if}
                </div>
              </li>
            {/each}
          </ol>
        {/key}
      </div>

      <div class="home-agent-code home-agent-pane" data-active={pane === 'code' ? '' : undefined}>
        <div class="home-agent-code-stack" data-view={view}>
          <div aria-hidden={view !== 'draft'} class="home-agent-code-view" data-active={view === 'draft' ? '' : undefined} data-draft={draft}>
            {#each before as line, index (index)}
              {@render codeLine({ line, number: index + 1, marks: conflictMarks, index, valueClass: 'home-agent-squiggle' })}
            {/each}
            <div aria-hidden="true" class="home-agent-hover">
              {@render ruleCode()}
            </div>
          </div>
          <div aria-hidden={view !== 'diff'} class="home-agent-code-view" data-active={view === 'diff' ? '' : undefined}>
            {#each before as line, index (index)}
              {#if line === after[index]}
                {@render codeLine({ line, number: index + 1 })}
              {:else}
                {@render codeLine({ line, marks: removedMarks, sign: '-' })}
                {@render codeLine({ line: after[index], number: index + 1, sign: '+' })}
              {/if}
            {/each}
          </div>
          <div aria-hidden={view !== 'applied'} class="home-agent-code-view" data-active={view === 'applied' ? '' : undefined}>
            {#each after as line, index (index)}
              {@render codeLine({ changed: line !== before[index], line, number: index + 1 })}
            {/each}
          </div>
        </div>
      </div>

      <div class="home-agent-pane home-agent-panel" data-active={pane === 'output' ? '' : undefined} data-panel={panel}>
        <!-- Each result arrives along the panel's top seam, the way its request left along the call's. -->
        {#if panel !== 'idle' && mode === 'tour'}
          {#key `${loop}-${panel}`}<span aria-hidden="true" class="home-agent-panel-signal"></span>{/key}
        {/if}
        <div class="home-agent-panel-header">
          <span class="home-agent-panel-label"><IconTerminal2 aria-hidden="true" {...icon} />{t('Output')}</span>
          <code class="home-agent-panel-tool" title={panel === 'idle' ? undefined : agentSessionCalls[panelCall(panel)].name}>{panel === 'idle' ? ' ' : agentSessionCalls[panelCall(panel)].name}</code>
        </div>
        <div class="home-agent-panel-body">
          <!-- Before the first result, the panel is a reserved slot. -->
          <div aria-hidden={panel !== 'idle'} class="home-agent-panel-idle home-agent-panel-view home-hatch" data-active={panel === 'idle' ? '' : undefined}></div>
          <div aria-hidden={panel !== 'tokens'} class="home-agent-panel-view" data-active={panel === 'tokens' ? '' : undefined}>
            <ul class="home-agent-tokens">
              {#each tokens as token (token.name)}
                <li class="home-agent-token" style:--home-agent-token={Math.min(parseFloat(token.value) / parseFloat(tokens[tokens.length - 1].value), 1)}><code>{token.name}</code><span class="home-agent-token-value">{token.value}</span><span aria-hidden="true" class="home-agent-token-bar"></span></li>
              {/each}
            </ul>
          </div>
          <div aria-hidden={panel !== 'rule'} class="home-agent-panel-view" data-active={panel === 'rule' ? '' : undefined}>
            <dl class="home-agent-facts">
              <div><dt>matchStatus</dt><dd><code>{inspection.matchStatus}</code></dd></div>
              <div><dt>cssSyntaxStatus</dt><dd><code>{inspection.cssSyntaxStatus}</code></dd></div>
              <div><dt>{t('Layer')}</dt><dd><code>@layer {inspection.layer}</code></dd></div>
              <div>
                <dt>{t('Token')}</dt>
                <!-- Break only between arguments, never inside a var(). -->
                <dd><code class="home-agent-rule-property">--{inspection.variable.name}</code><code>{#each variableParts as part, index (index)}<span class="home-agent-fact-argument">{part}{index < variableParts.length - 1 ? ',' : ''}</span>{index < variableParts.length - 1 ? ' ' : ''}{/each}</code></dd>
              </div>
            </dl>
          </div>
          <div aria-hidden={panel !== 'problems'} class="home-agent-panel-view" data-active={panel === 'problems' ? '' : undefined}>
            <ul class="home-agent-problems">
              {#each problems as problem (problem.location)}
                <li class="home-agent-problem"><IconAlertTriangle aria-hidden="true" class="home-tone-warn" {...icon} /><span class="min-w(0)"><span class="home-agent-problem-message">{#each problem.message.split(' ') as word, index (index)}{index ? ' ' : ''}{#if /[-:]/.test(word)}<span class="home-agent-word">{word}</span>{:else}{word}{/if}{/each}</span><span class="home-agent-problem-meta">{problem.source.replace('@master/css/', '')} · {problem.location.replace(`${file}:`, t('Ln') + ' ')}</span></span></li>
              {/each}
            </ul>
          </div>
          <div aria-hidden={panel !== 'preview'} class="home-agent-panel-view" data-active={panel === 'preview' ? '' : undefined}>
            <dl class="home-agent-facts">
              <div><dt>{t('Changes')}</dt><dd><code>{file}</code>{@render diffstat(changed, changed)}</dd></div>
              <div><dt>confirmToken</dt><dd><code class="home-agent-token-chip">{shortToken(agentSessionCalls.apply.args.confirmToken as string)}</code><span class="home-agent-fact-note">{t('Valid for {count} minutes').replace('{count}', String(agentSessionResults.previewMinutes))}</span></dd></div>
            </dl>
          </div>
          <div aria-hidden={panel !== 'apply'} class="home-agent-panel-view" data-active={panel === 'apply' ? '' : undefined}>
            <dl class="home-agent-facts home-agent-hashes" data-hashing={beat === at.apply ? '' : undefined} data-matched={beat >= at.written ? '' : undefined}>
              <div><dt>{t('Preview made from')}</dt><dd><code>sha256 <span class="home-agent-hash">{shortHash(agentSessionResults.beforeHash)}</span></code></dd></div>
              <div>
                <dt>{t('File on disk')}</dt>
                <!-- The moment the digests match: a seal in gold that settles to the ok tone. -->
                <dd><code>sha256 <span class="home-agent-hash home-agent-hash-live">{shortHash(hash)}</span></code><span class={['home-agent-match', beat >= at.written && 'home-agent-match-shown']}><IconShieldCheck aria-hidden="true" size={16} stroke={1.75} /></span></dd>
              </div>
              <div class={['home-agent-fact-later', beat >= at.written && 'home-agent-fact-shown']}><dt>{t('Written')}</dt><dd><code>sha256 {shortHash(agentSessionResults.afterHash)}</code></dd></div>
            </dl>
          </div>
          <div aria-hidden={panel !== 'clean'} class="home-agent-clean home-agent-panel-view" data-active={panel === 'clean' ? '' : undefined}>
            <div class="home-agent-verdict" data-checking={beat < at.clean ? '' : undefined}>
              <span aria-hidden="true" class="home-agent-verdict-mark">{#if beat < at.clean}<IconLoader2 class="home-spin" size={24} stroke={1.5} />{:else}<IconCircleCheck size={24} stroke={1.5} />{/if}</span>
              <div><p class="home-agent-verdict-title">{beat < at.clean ? t('Checking') : t('No problems')}</p><code>{file}</code></div>
              <span class="home-agent-verdict-count" aria-hidden="true">{beat < at.clean ? '—' : agentSessionResults.relint.diagnostics}</span>
            </div>
            <div class="home-agent-receipt"><span><IconShieldCheck aria-hidden="true" {...icon} />{t('Hash matched, file written')}</span><code>sha256 {shortHash(agentSessionResults.afterHash)}</code></div>
          </div>
        </div>
      </div>

      <div class="home-agent-steps">
        {#if !reduceMotion}
          <!-- The page lamp writes its light onto this button before or after hydration. -->
          <button aria-label={mode === 'tour' ? t('Pause the session') : t('Play the session')} class="home-agent-play home-lit home-stone home-stone-button home-stone-quiet" onclick={toggle} type="button">{#if mode === 'tour'}<IconPlayerPauseFilled aria-hidden="true" size={12} />{:else}<IconPlayerPlayFilled aria-hidden="true" size={12} />{/if}</button>
        {/if}
        <ol aria-label={t('Session steps')} class="home-agent-step-list">
          {#each agentSessionStages as name, index (name)}
            {@const duration = beats.filter((item, beatIndex) => item.stage === index && beatIndex !== at.outro).reduce((total, item) => total + item.ms, 0)}
            <!-- Each beat begins at its actual place in the chapter, including when resuming a chosen step. -->
            {@const elapsed = beats.slice(0, beat).filter((item) => item.stage === index).reduce((total, item) => total + item.ms, 0)}
            <li>
              <button
                aria-current={index === stage ? 'step' : undefined}
                class="home-agent-step"
                data-state={index < stage || (index === stage && mode === 'chosen') ? 'done' : index === stage ? 'current' : undefined}
                onclick={() => choose(index)}
                type="button"><span class="home-agent-step-name"><span aria-hidden="true" class="home-agent-step-index">{String(index + 1).padStart(2, '0')}</span>{t(name)}</span><span aria-hidden="true" class="home-agent-step-track">{#if index === stage && mode !== 'chosen'}{#key `${loop}-${beat}`}<span class="home-agent-step-fill" style:animation-duration={`${duration}ms`} style:animation-delay={`-${elapsed}ms`} style:animation-play-state={running ? 'running' : 'paused'}></span>{/key}{/if}</span></button>
            </li>
          {/each}
        </ol>
      </div>
    </div>
  </div>
  <!-- Tucked under the window, open on the page: the server the session calls, joined to it by the beam its calls travel. -->
  <AgentsOrbit call={orbitCall} {classRows} paused={!running} />
</div>
