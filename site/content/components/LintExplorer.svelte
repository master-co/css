<script lang="ts" module>
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
</script>

<script lang="ts">
  import { onMount, tick, untrack, type Snippet } from 'svelte'
  import IconAlertTriangle from '@tabler/icons-svelte-runes/icons/alert-triangle'
  import IconBrandHtml5 from '@tabler/icons-svelte-runes/icons/brand-html5'
  import IconBulb from '@tabler/icons-svelte-runes/icons/bulb'
  import IconCircleCheck from '@tabler/icons-svelte-runes/icons/circle-check'
  import IconCircleX from '@tabler/icons-svelte-runes/icons/circle-x'
  import IconInfoCircle from '@tabler/icons-svelte-runes/icons/info-circle'
  import IconPlugConnected from '@tabler/icons-svelte-runes/icons/plug-connected'
  import IconRotateClockwise from '@tabler/icons-svelte-runes/icons/rotate-clockwise'
  import IconTerminal2 from '@tabler/icons-svelte-runes/icons/terminal-2'
  import { getSite } from '@master/internal-site/site'
  import HomeIllustrationArt from '@master/internal-site/home/HomeIllustrationArt.svelte'
  import type { HomeCompactIconId } from '@master/internal-site/home/home-illustration.ts'
  import { pointerMoved } from './pointer-motion'

  /**
   * Each rule plays one check: the linter reads the classes, reports the problem in all three
   * surfaces at once, offers the quick fix and applies it. Rules without a fix stop at the report.
   */
  type Phase = 'idle' | 'scan' | 'report' | 'action' | 'apply' | 'fixed'
  type FixKind = 'sort' | 'remove' | 'diff' | 'report'

  const phaseAt = { scan: 450, report: 1450, action: 2700, apply: 4100, fixed: 4950 }
  /** How long a rule stays selected while the explorer tours, by whether it ends on a fix. */
  const tourDuration = { fix: 8600, report: 6600 }

  const severityIcons = {
    error: { Icon: IconCircleX, tone: 'home-tone-error' },
    info: { Icon: IconInfoCircle, tone: 'home-tone-info' },
    warning: { Icon: IconAlertTriangle, tone: 'home-tone-warn' }
  }

  let { icons, rules }: { icons: HomeCompactIconId[], rules: LintExplorerRule[] } = $props()
  const { t } = getSite()
  let active = $state(0)
  // The server renders the clean source; in view, the check plays from there.
  let phase = $state<Phase>('idle')
  let touring = $state(true)
  let held = $state(false)
  let finished = $state(false)
  let elapsed = 0
  let currentPhase: Phase = 'idle'
  let flip: Map<string, DOMRect> | undefined
  let progressElement = $state<HTMLSpanElement>()
  const tabElements: (HTMLButtonElement | undefined)[] = []
  const sourceElements: (HTMLDivElement | undefined)[] = $state([])
  let menuElement = $state<HTMLDivElement>()
  let root = $state<HTMLDivElement>()
  let inView = $state(false)
  // Read after hydration, so the server and the first paint agree.
  let reduceMotion = $state(false)
  const views = $derived(rules.map(createRuleView))
  const view = $derived(views[active])
  const rule = $derived(rules[active])
  const viewKind = $derived(view.kind)
  const finalPhase: Phase = $derived(viewKind === 'sort' || viewKind === 'remove' ? 'fixed' : 'report')
  const duration = $derived(viewKind === 'sort' || viewKind === 'remove' ? tourDuration.fix : tourDuration.report)
  // A reader holds the tour on a revealed check: one held before the report plays on until it reports.
  const revealed = $derived(phase !== 'idle' && phase !== 'scan')
  const playing = $derived(inView && !reduceMotion && !finished && (touring ? !(held && revealed) : true))

  onMount(() => {
    const motion = matchMedia('(prefers-reduced-motion: reduce)')
    const updateMotion = () => { reduceMotion = motion.matches }
    updateMotion()
    motion.addEventListener('change', updateMotion)
    // Notifications batch while layout settles; the last entry is the current state.
    const observer = new IntersectionObserver((entries) => { const entry = entries[entries.length - 1]; inView = entry.isIntersecting }, { threshold: 0.3 })
    if (root) observer.observe(root)
    return () => {
      motion.removeEventListener('change', updateMotion)
      observer.disconnect()
    }
  })

  function goTo(next: Phase) {
    if (next === currentPhase) return
    // The class order fix moves tokens: remember where each one starts before Svelte reorders them.
    if (next === 'apply' && view.kind === 'sort') flip = measureTokens(sourceElements[active])
    currentPhase = next
    phase = next
  }

  // Each selection starts the check over, before paint, so a rule never shows the last rule's state;
  // without motion it opens straight on the problem and its fix.
  $effect.pre(() => {
    const kind = viewKind
    const reduced = reduceMotion
    void active
    untrack(() => {
      elapsed = 0
      finished = false
      const start: Phase = reduced ? (kind === 'sort' || kind === 'remove' ? 'action' : 'report') : 'idle'
      currentPhase = start
      phase = start
      // The progress leaf is the chosen rule's own; reset it once the selection has rendered.
      void tick().then(() => progressElement?.style.setProperty('--home-lint-progress', '0'))
    })
  })

  $effect(() => {
    const index = active
    const total = duration
    const final = finalPhase
    const tour = touring
    const count = rules.length
    const kind = viewKind
    if (!playing) return
    let frame = 0
    let last = 0
    const step = (time: number) => {
      if (last) elapsed += Math.min(time - last, 100)
      last = time
      progressElement?.style.setProperty('--home-lint-progress', String(Math.min(1, elapsed / total)))
      goTo(timelinePhase(kind, elapsed))
      if (tour ? elapsed >= total : elapsed >= phaseAt[final === 'fixed' ? 'fixed' : 'report']) {
        if (tour) active = (index + 1) % count
        else finished = true
        return
      }
      frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  })

  // Tokens glide from where they were to where the fix puts them: the sort reorders them in place,
  // and a fix preview copies them from the removed line into the added one.
  $effect(() => {
    const source = sourceElements[active]
    const current = view
    if (!source || reduceMotion) return
    if (phase === 'apply' && current.kind === 'sort' && flip) {
      const first = flip
      flip = undefined
      const order = current.sortedKeys
      for (const element of source.querySelectorAll<HTMLElement>('[data-token]')) {
        const from = first.get(element.dataset.token!)
        if (!from) continue
        const to = element.getBoundingClientRect()
        glide(element, from.left - to.left, from.top - to.top, order.indexOf(element.dataset.token!) * 45)
      }
    }
    if (phase === 'report' && current.kind === 'diff') {
      const removed = new Map([...source.querySelectorAll<HTMLElement>('[data-diff="remove"] [data-token]')].map((element) => [element.dataset.token!, element.getBoundingClientRect()]))
      source.querySelectorAll<HTMLElement>('[data-diff="add"] [data-token]').forEach((element, index) => {
        const from = removed.get(element.dataset.token!)
        if (!from) return
        const to = element.getBoundingClientRect()
        // One class after another, in the expected order, so the copy reads as taking them in turn.
        glide(element, from.left - to.left, from.top - to.top, index * 110)
      })
    }
  })

  // The quick fix menu opens under the first reported token and stays inside the editor.
  $effect(() => {
    const menu = menuElement
    const source = sourceElements[active]
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
  })

  function select(index: number) {
    touring = false
    active = index
  }

  // A control that disappears hands focus back to the chosen rule, so keyboard readers keep their place.
  function keepFocus() {
    if (document.activeElement instanceof HTMLElement && document.activeElement.closest('.home-lint-menu, .home-lint-replay')) {
      tabElements[active]?.focus()
    }
  }

  function applyFix() {
    keepFocus()
    touring = false
    if (reduceMotion) {
      goTo('fixed')
      return
    }
    elapsed = phaseAt.apply
    finished = false
    goTo('apply')
  }

  function replay() {
    keepFocus()
    touring = false
    elapsed = 0
    finished = false
    const start: Phase = reduceMotion ? (view.kind === 'sort' || view.kind === 'remove' ? 'action' : 'report') : 'idle'
    currentPhase = start
    phase = start
  }

  function handleKeyDown(event: KeyboardEvent) {
    const next = ({ ArrowDown: active + 1, ArrowRight: active + 1, ArrowUp: active - 1, ArrowLeft: active - 1, Home: 0, End: rules.length - 1 } as Record<string, number>)[event.key]
    if (next === undefined) return
    event.preventDefault()
    const index = (next + rules.length) % rules.length
    select(index)
    tabElements[index]?.focus()
  }

  const reported = $derived(phase === 'report' || phase === 'action' || phase === 'apply')
  const fixed = $derived(phase === 'fixed')
  // Replay returns to the start once a check has finished; without motion, once its fix is shown.
  const done = $derived(!touring && (reduceMotion ? phase === 'fixed' : finished))
  const fixParts = $derived(String(t('Fix this {rule} problem')).split('{rule}'))

  /** `card.html:1:17` reads `1:17` beside the file's own tab; a location without a line keeps its file. */
  function shortLocation(location: string) {
    const match = location.match(/:(\d+:\d+)$/)
    return match ? match[1] : location
  }

  /** The state of a surface beside the editor. */
  function paneState(phase: Phase) {
    const off = Boolean(rule.reach.eslintOption)
    return off
      ? 'off'
      : phase === 'idle'
        ? 'idle'
        : phase === 'scan'
          ? 'running'
          : phase === 'fixed'
            ? 'resolved'
            : 'lit'
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

  function measureTokens(source: HTMLElement | undefined) {
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
</script>

<!-- One status style for all three surfaces: a dot that carries the tone, and a quiet word. -->
{#snippet lintStatus(tone: 'idle' | 'running' | 'off' | 'ok' | HomeCodeWindowProblem['severity'], label: string)}
  <span class="home-lint-status" data-tone={tone}>{label}</span>
{/snippet}

{#snippet severityGlyph(severity: HomeCodeWindowProblem['severity'])}
  {@const { Icon, tone } = severityIcons[severity]}
  <Icon class={tone} size={13} stroke={2} />
{/snippet}

<!-- A column ruler over the code: the reported range is drawn on it like a dimension, with a guide down to the line. -->
{#snippet lintRuler(view: RuleView)}
  {@const range = view.range}
  <div aria-hidden="true" class="home-lint-ruler">
    {#each [10, 20, 30, 40, 50, 60, 70] as column (column)}
      <!-- A tick number under the location callout steps aside so the two never read as one. -->
      <span
        class="home-lint-ruler-label"
        data-covered={range && column >= range.start - 2 && column <= range.start + String(range.line).length + String(range.start).length + 3 ? '' : undefined}
        style:--column={column}>
        <span>{column}</span>
      </span>
    {/each}
    {#if range}
      {#key view.key}
        <span class="home-lint-range" style:--column={range.start} style:--end={range.end} style:--line={range.line}>
          <span class="home-lint-loc home-lint-range-label">{range.line}:{range.start}</span>
          <span class="home-lint-range-end"></span>
        </span>
      {/key}
    {/if}
  </div>
{/snippet}

{#snippet tokenSlot(token: ClassToken, leading: boolean, marked: boolean, markedNext: boolean, order: number | undefined, removing: boolean, keeps: boolean)}
  {@const separator = token.value.indexOf(':')}
  {@const declaration = separator > 0 && /^[a-z-]+$/.test(token.value.slice(0, separator))}
  {#if leading}{' '}{/if}<span
    class="home-lint-token"
    data-keeps={keeps ? '' : undefined}
    data-marked={marked ? '' : undefined}
    data-marked-next={markedNext ? '' : undefined}
    data-removing={removing ? '' : undefined}
    data-token={token.key}
    style:--column={token.column}
    style:--length={token.value.length}>{#if declaration}<span class="home-lint-property">{token.value.slice(0, separator)}</span><span class="home-lint-punct">:</span>{token.value.slice(separator + 1)}{:else}{token.value}{/if}{#if order !== undefined}<span aria-hidden="true" class="home-lint-order" style:--order={order}>{order}</span>{/if}</span>
{/snippet}

<!-- One rule's source. Only the chosen one plays; the others keep their cell so the editor never resizes. -->
{#snippet lintSource(index: number, view: RuleView, phase: Phase, children?: Snippet)}
  {@const isActive = index === active}
  {@const marked = phase === 'report' || phase === 'action' || (phase === 'apply' && view.kind === 'remove')}
  {@const showFixed = view.fixedLines && ((view.kind === 'sort' && (phase === 'apply' || phase === 'fixed')) || (view.kind === 'remove' && phase === 'fixed'))}
  {@const lines = showFixed ? view.fixedLines! : view.lines}
  <div
    aria-hidden={isActive ? undefined : 'true'}
    class="home-lint-source"
    data-active={isActive ? '' : undefined}
    data-kind={view.kind}
    bind:this={sourceElements[index]}>
    {#each lines as line, lineIndex (lineIndex)}
      <!-- A diff numbers the removed line like the line that replaces it. -->
      {@const number = lines.slice(0, lineIndex).filter((item) => item.diff !== 'remove').length + 1}
      {@const problemLine = view.range?.line === lineIndex + 1}
      <div class="home-lint-line" data-diff={line.diff} data-problem={problemLine && marked ? '' : undefined}>
        <span aria-hidden="true" class="home-lint-gutter">
          {#key phase === 'action'}
            <span class="home-lint-glyph">{#if line.diff}<span class="home-lint-diff-sign">{line.diff === 'add' ? '+' : '−'}</span>{:else if problemLine && marked && phase !== 'apply'}{#if phase === 'action'}<IconBulb class="home-lint-bulb" size={13} stroke={1.75} />{:else}{@render severityGlyph(view.severity)}{/if}{/if}</span>
          {/key}
          <span class="home-lint-number">{number}</span>
        </span>
        <code class="home-lint-text">{#each line.segments as segment, segmentIndex (segmentIndex)}{#if segment.kind === 'classes'}<span>{#each segment.tokens as token, tokenIndex (token.key)}{@render tokenSlot(
          token,
          tokenIndex > 0,
          marked && token.marked,
          marked && token.markedNext,
          phase === 'action' && view.kind === 'sort' ? view.sortedKeys.indexOf(token.key) + 1 : undefined,
          view.kind === 'remove' && view.removedKeys.includes(token.key) && (phase === 'apply'),
          view.kind === 'remove' && token.key === view.keptKey && (phase === 'action' || phase === 'apply')
        )}{/each}</span>{:else}<span class={`home-lint-${segment.kind === 'text' ? 'plain' : segment.kind}`}>{segment.text}</span>{/if}{/each}</code>
      </div>
    {/each}
    {@render children?.()}
  </div>
{/snippet}

<!--
  The CLI's report for the sample: the command, then the stylish line's location, severity and rule.
  The message column is left to the guide; a rule only ESLint runs shows no report at all.
-->
{#snippet cliOutput(rule: LintExplorerRule, view: RuleView)}
  {#if rule.reach.cli}
    <pre class="home-lint-terminal"><span class="home-lint-command"><span class="home-lint-prompt">$</span> {rule.reach.cli}</span>{#if view.kind !== 'diff'}<span class="home-lint-out home-lint-report" style:--i={0}><span class="home-lint-loc">{view.range ? `${view.range.line}:${view.range.start}` : ''}</span><span class={rule.problem.severity === 'error' ? 'home-tone-error' : 'home-tone-warn'}>{rule.problem.severity}</span><span class="home-lint-rule-id">{rule.problem.source}</span></span>{/if}</pre>
  {/if}
{/snippet}

{#snippet jsonKey(name: string)}<span class="home-lint-json-key">&quot;{name}&quot;</span>{/snippet}

{#snippet jsonValue(text: string | number)}<span class={typeof text === 'number' ? 'home-lint-json-number' : 'home-lint-json-string'}>{typeof text === 'number' ? text : `"${text}"`}</span>{/snippet}

<!-- What the MCP server returns for the same sample: the same rule, severity, line and column, as JSON. -->
{#snippet mcpOutput(rule: LintExplorerRule, view: RuleView)}
  {#if rule.reach.mcp}
    <pre class="home-lint-terminal"><span class="home-lint-command"><span class="home-lint-prompt">→</span> {rule.reach.mcp}<span class="home-lint-call"> {rule.file}{rule.reach.rules ? ` · rules: ${rule.reach.rules}` : ''}</span></span>{#if rule.reach.mcp === 'mastercss_preview_fixes'}<span class="home-lint-out" style:--i={0}>{@render jsonKey('mode')}: {@render jsonValue('lint-fixes')},</span><span class="home-lint-out" style:--i={1}>{@render jsonKey('preview')}: {'{ '}{@render jsonKey('confirmToken')}: {@render jsonValue('…')}{' }'}</span>{:else}<span class="home-lint-out" style:--i={0}>{@render jsonKey('ruleId')}: {@render jsonValue(rule.problem.source.replace('@master/css/', ''))},</span><span class="home-lint-out" style:--i={1}>{@render jsonKey('severity')}: {@render jsonValue(rule.problem.severity)},</span><span class="home-lint-out" style:--i={2}>{@render jsonKey('loc')}: {'{ '}{@render jsonKey('start')}: {'{ '}<span class="home-lint-loc">{@render jsonKey('line')}: {@render jsonValue(view.range?.line ?? 1)}, {@render jsonKey('column')}: {@render jsonValue(view.range?.start ?? 1)}</span>{' } }'}</span>{/if}</pre>
  {/if}
{/snippet}

<!-- A surface beside the editor. It lights up the moment the editor reports, with the same rule at the same line and column. -->
{#snippet lintPane(Icon: typeof IconTerminal2, litLabel: string, name: string, note: string, output: Snippet<[LintExplorerRule, RuleView]>)}
  {@const state = paneState(phase)}
  <section class="home-lint-pane" data-state={state}>
    <header class="home-lint-pane-bar">
      <span class="home-lint-tab">
        <Icon aria-hidden="true" class="home-lint-tab-icon" size={14} stroke={1.75} />
        <span class="home-lint-tab-label">{name}</span>
      </span>
      <span class="home-lint-pane-package">{note}</span>
      {@render lintStatus(state === 'lit' ? rule.problem.severity : state === 'resolved' ? 'ok' : state, state === 'off' ? t('ESLint only') : state === 'resolved' ? t('Fixed') : state === 'lit' ? (rule.problem.severity === 'info' ? litLabel : t('1 problem')) : state === 'running' ? t('Running') : t('Ready'))}
    </header>
    <div class="home-lint-pane-body">
      {#each rules as item, index (item.title)}
        <div aria-hidden={index === active ? undefined : 'true'} class="home-lint-pane-cell" data-active={index === active ? '' : undefined}>
          {@render output(item, views[index])}
        </div>
      {/each}
    </div>
    <span aria-hidden="true" class="home-edge-light home-lit"></span>
  </section>
{/snippet}

{#snippet quickFix()}
  <div aria-hidden={phase === 'action' ? undefined : 'true'} class="home-lint-menu" data-open={phase === 'action' ? '' : undefined} bind:this={menuElement}>
    <p class="home-annotation home-lint-menu-label">{t('Quick fix')}</p>
    <button class="home-lint-menu-item" onclick={applyFix} tabindex={phase === 'action' ? 0 : -1} type="button">
      <IconBulb aria-hidden="true" class="home-lint-menu-icon" size={14} stroke={1.75} />
      <span>{#each fixParts as part, partIndex (partIndex)}{#if partIndex}<code>{rule.problem.source}</code>{/if}{part}{/each}</span>
    </button>
  </div>
{/snippet}

<!--
  Reading means moving over the bench; content scrolled under a resting pointer does not hold the tour,
  including the motionless pointermove WebKit sends once scrolling stops.
-->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="home-lint"
  data-phase={phase}
  data-reported={reported || fixed ? '' : undefined}
  data-severity={rule.problem.severity}
  data-touring={touring && !reduceMotion ? '' : undefined}
  onfocusout={(event) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) held = false
  }}
  onfocusin={() => { held = true }}
  onpointermove={(event) => {
    if (pointerMoved(event)) held = true
  }}
  onpointerleave={() => { held = false }}
  bind:this={root}
  style:--home-lint-columns={view.columns}
  style:--home-lint-lines={view.lines.length}>
  <div class="home-lint-aside">
    <div aria-label={t('Lint rules')} aria-orientation="vertical" class="home-lint-rules" role="tablist">
      {#each rules as item, index (item.title)}
        <button
          aria-controls="home-lint-panel"
          aria-selected={index === active}
          class="home-lint-rule"
          id={`home-lint-rule-${index}`}
          onclick={() => select(index)}
          onkeydown={handleKeyDown}
          bind:this={tabElements[index]}
          role="tab"
          tabindex={index === active ? 0 : -1}
          type="button">
          <span aria-hidden="true" class="home-lint-rule-glyph"><HomeIllustrationArt class="home-compact-icon" icon={icons[index]} size={48} /></span>
          <span class="home-lint-rule-title">{t(item.title)}</span>
          {#if index === active}<span aria-hidden="true" class="home-lint-rule-progress" bind:this={progressElement}></span>{/if}
        </button>
      {/each}
    </div>
  </div>

  <div class="home-lint-stage">
    <div aria-labelledby={`home-lint-rule-${active}`} class="home-lint-editor" id="home-lint-panel" role="tabpanel">
      <div class="home-lint-bar">
        <span aria-hidden="true" class="home-lint-dots"><i></i><i></i><i></i></span>
        <span class="home-lint-tab">
          <IconBrandHtml5 aria-hidden="true" class="home-lint-tab-icon" size={14} stroke={1.75} />
          <span class="home-lint-tab-label">{rule.file}</span>
        </span>
        <span class="home-lint-surface-name">{rule.problem.severity === 'info' ? t('MCP server') : 'ESLint'}</span>
        {@render lintStatus(
          phase === 'idle' ? 'idle' : phase === 'scan' ? 'running' : fixed ? 'ok' : rule.problem.severity,
          phase === 'idle'
            ? t('Ready')
            : phase === 'scan'
              ? t('Checking')
              : fixed
                ? t('No problems')
                : rule.problem.severity === 'info' ? t('1 file changed') : t('1 problem')
        )}
      </div>

      <div class="home-lint-code">
        <div class="home-lint-reading">
          {@render lintRuler(view)}
          <div class="home-lint-sources">
            {#each views as item, index (rules[index].title)}
              {@render lintSource(index, item, index === active ? phase : 'idle', index === active && (view.kind === 'sort' || view.kind === 'remove') ? quickFix : undefined)}
            {/each}
          </div>
          <span aria-hidden="true" class="home-lint-beam"></span>
        </div>
      </div>

      <!-- One line: the rule and the place it points at; the message lives in the guide. -->
      <div class="home-lint-problems">
        <div aria-live={touring ? undefined : 'polite'} class="home-lint-problem-stack">
          {#each rules as item, index (item.title)}
            {@const { Icon, tone: itemTone } = severityIcons[item.problem.severity]}
            {@const current = index === active}
            <div aria-hidden={current ? undefined : 'true'} class="home-lint-problem-cell" data-active={current ? '' : undefined}>
              <p class="home-lint-problem" data-shown={current && reported ? '' : undefined}>
                <Icon aria-hidden="true" class={['home-lint-problem-icon', itemTone].join(' ')} size={15} stroke={1.75} />
                <span class="home-lint-problem-rule">{item.problem.source}</span>
                <span class="home-lint-loc">{shortLocation(item.problem.location)}</span>
              </p>
              {#if item.fixedCode}
                <p class="home-lint-problem" data-shown={current && fixed ? '' : undefined}>
                  <IconCircleCheck aria-hidden="true" class="home-lint-problem-icon home-tone-ok" size={15} stroke={1.75} />
                  <span class="home-lint-problem-rule">{item.problem.source}</span>
                  <span>{t('Fixed')}</span>
                </p>
              {/if}
            </div>
          {/each}
        </div>
        {#if done}
          <button class="home-lint-replay" onclick={replay} type="button">
            <IconRotateClockwise aria-hidden="true" size={14} stroke={1.75} />
            {t('Replay')}
          </button>
        {/if}
      </div>
      <span aria-hidden="true" class="home-edge-light home-lit"></span>
    </div>

    <div class="home-lint-surfaces">
      {@render lintPane(IconTerminal2, t('Same fix'), t('CLI'), '@master/css-cli', cliOutput)}
      {@render lintPane(IconPlugConnected, t('Preview'), t('MCP server'), '@master/css-mcp', mcpOutput)}
    </div>
  </div>
</div>
