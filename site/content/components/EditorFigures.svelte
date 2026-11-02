<script lang="ts">
  import { onMount } from 'svelte'
  import IconColorPicker from '@tabler/icons-svelte-runes/icons/color-picker'
  import IconFileCode from '@tabler/icons-svelte-runes/icons/file-code'
  import IconPlayerPauseFilled from '@tabler/icons-svelte-runes/icons/player-pause-filled'
  import IconPlayerPlayFilled from '@tabler/icons-svelte-runes/icons/player-play-filled'
  import IconVariable from '@tabler/icons-svelte-runes/icons/variable'
  import IconX from '@tabler/icons-svelte-runes/icons/x'
  import { getSite } from '@master/internal-site/site'
  import HomeEditorBar from './HomeEditorBar.svelte'
  import HomeEditorLights from './HomeEditorLights.svelte'
  import HomeEditorTab from './HomeEditorTab.svelte'
  import HomeEditorWindow from './HomeEditorWindow.svelte'
  import HomeIllustrationArt from '@master/internal-site/home/HomeIllustrationArt.svelte'
  import { createEditorScenes, hexToHsv, hsvToHex, isDark, measureEditor, menuRows, picker, pickerStyle, type Frame, type Geometry, type HSV } from './editor-scene'
  import { editorCSSParts } from './editor-syntax'
  import { filterCompletions, type EditorClass, type EditorFeature, type EditorModel, type EditorRole } from './editor-content'
  import type { HomeIllustrationId } from '@master/internal-site/home/home-illustration.ts'

  let { features, icons, model }: { features: readonly EditorFeature[], icons: HomeIllustrationId[], model: EditorModel } = $props()
  const { t } = getSite()
  const descriptionId = $props.id()
  const geometry = $derived(measureEditor(model))
  const scenes = $derived(createEditorScenes(model, geometry))
  let sceneIndex = $state(0)
  let touring = $state(true)
  let paused = $state(false)
  let finished = $state(false)
  let loop = $state(0)
  let pointerHeld = $state(false)
  let focusHeld = $state(false)
  let codeFocused = $state(false)
  let visible = $state(true)
  let viewportWidth = $state(0)
  // The opening frame, taken once; the tour shows later frames.
  // svelte-ignore state_referenced_locally
  let frame = $state.raw<Frame>(scenes.complete.frame(0, false))
  // The reader's own pointer: a class it rests on, and a color it picks.
  let inside = $state(false)
  let inspected = $state<number | null>(null)
  let touchInspected = $state<number | null>(null)
  let readerPicker = $state(false)
  let readerColor = $state.raw<HSV | null>(null)
  let elapsed = 0
  let frameKey = ''
  let root = $state<HTMLDivElement>()
  let viewportElement = $state<HTMLDivElement>()
  let frameElement = $state<HTMLDivElement>()
  let touchStart: { index: number, x: number, y: number } | null = null
  const progressElements: (HTMLSpanElement | undefined)[] = []
  let leaveTimer: ReturnType<typeof setTimeout> | undefined
  let inView = $state(false)
  // Read after hydration, so the server and the first paint agree.
  let reduceMotion = $state(false)
  const sceneId = $derived(features[sceneIndex].id)
  const scene = $derived(scenes[sceneId])
  const playing = $derived(inView && visible && !paused && !finished && !reduceMotion && !inside && !codeFocused && !readerPicker && (!touring || (!pointerHeld && !focusHeld)))

  onMount(() => {
    const motion = matchMedia('(prefers-reduced-motion: reduce)')
    const updateMotion = () => { reduceMotion = motion.matches }
    updateMotion()
    motion.addEventListener('change', updateMotion)
    // Notifications batch while layout settles; the last entry is the current state.
    const observer = new IntersectionObserver((entries) => { const entry = entries[entries.length - 1]; inView = entry.isIntersecting }, { threshold: 0.3 })
    if (frameElement) observer.observe(frameElement)
    return () => {
      motion.removeEventListener('change', updateMotion)
      observer.disconnect()
    }
  })

  onMount(() => {
    const visibility = () => { visible = !document.hidden }
    visibility()
    document.addEventListener('visibilitychange', visibility)
    // A pointer or focus can already be here when the island hydrates.
    pointerHeld = !!root?.matches(':hover') && !root.querySelector('.home-editor-playback:hover')
    focusHeld = !!root?.contains(document.activeElement) && !document.activeElement?.closest('.home-editor-playback')
    return () => {
      document.removeEventListener('visibilitychange', visibility)
      clearTimeout(leaveTimer)
    }
  })

  onMount(() => {
    const viewport = viewportElement
    if (!viewport || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(([entry]) => { viewportWidth = entry.contentRect.width })
    observer.observe(viewport)
    return () => observer.disconnect()
  })

  function show(next: Frame) {
    const key = JSON.stringify(next)
    if (key === frameKey) return
    frameKey = key
    frame = next
  }

  // Only the tiny progress leaf changes every frame; the code and illustrations stay untouched.
  function setProgress(value: number, index = sceneIndex) {
    progressElements[index]?.style.setProperty('--editor-progress', value.toFixed(4))
  }

  // Reduced motion shows each scene's revealed moment, without a tour.
  $effect(() => {
    if (!reduceMotion) return
    const current = scene
    const index = sceneIndex
    elapsed = current.hold
    show(current.frame(current.hold, false))
    setProgress(1, index)
  })

  $effect(() => {
    const current = scene
    const index = sceneIndex
    const tour = touring
    const round = loop
    const count = features.length
    if (!playing) return
    let frameId = 0
    let last = 0
    const tick = (time: number) => {
      if (last) elapsed += Math.min(time - last, 100)
      last = time
      if (!tour && elapsed >= current.hold) {
        show(current.frame(current.hold, false))
        setProgress(1, index)
        finished = true
        return
      }
      if (elapsed >= current.duration) {
        elapsed = 0
        const next = (index + 1) % count
        setProgress(0, next)
        if (next === 0) loop += 1
        readerColor = null
        sceneIndex = next
        return
      }
      show(current.frame(elapsed, tour && index === 0 && round > 0))
      setProgress(tour ? elapsed / current.duration : 1, index)
      frameId = requestAnimationFrame(tick)
    }
    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  })

  function choose(index: number) {
    elapsed = 0
    touring = false
    paused = false
    finished = false
    readerPicker = false
    inspected = null
    touchInspected = null
    readerColor = null
    sceneIndex = index
    loop += 1
    show(scenes[features[index].id].frame(reduceMotion ? scenes[features[index].id].hold : 0, false))
    setProgress(reduceMotion ? 1 : 0, index)
  }

  function togglePlayback() {
    touchInspected = null
    if (touring && !paused) {
      paused = true
      return
    }
    if (!touring) elapsed = 0
    touring = true
    paused = false
    finished = false
  }

  function inspect(index: number | null) {
    clearTimeout(leaveTimer)
    if (index !== null) {
      inspected = index
      return
    }
    const reading = () => root?.querySelector('.home-editor-hover-card')?.contains(document.activeElement)
    if (!reading()) leaveTimer = setTimeout(() => { if (!reading()) inspected = null }, 90)
  }

  function openPicker() {
    touring = false
    paused = true
    readerPicker = true
    inspected = null
    touchInspected = null
  }

  function closePicker(restoreFocus = true) {
    touring = false
    paused = true
    readerPicker = false
    show({ ...frame, picker: false })
    if (restoreFocus) root?.querySelector<HTMLButtonElement>('.home-editor-swatch[data-editable]')?.focus({ preventScroll: true })
  }

  $effect(() => {
    if (!readerPicker) return
    root?.querySelector<HTMLInputElement>('.home-editor-picker input')?.focus({ preventScroll: true })
    const outside = (event: PointerEvent) => {
      if (!root?.querySelector('.home-editor-body')?.contains(event.target as Node)) closePicker(false)
    }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  })

  $effect(() => {
    if (touchInspected === null) return
    const outside = (event: PointerEvent) => {
      if (root?.querySelector('.home-editor-body')?.contains(event.target as Node)) return
      touchInspected = null
      inspected = null
    }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  })

  // The reader's pointer stands in for the drawn one: what it rests on wins over the scene.
  // Resting inside the window but off the classes holds whatever the scene revealed.
  const readerInspection = $derived(touchInspected ?? (inside || codeFocused ? inspected : null))
  const hoverIndex = $derived(readerPicker ? null : readerInspection ?? frame.hover)
  const pickerOpen = $derived(readerPicker || (frame.picker && hoverIndex === null))
  const menuOpen = $derived(!readerPicker && frame.menu !== null && hoverIndex === null)
  const literal = $derived(readerColor ?? frame.color)
  const literalHex = $derived(literal ? hsvToHex(literal) : geometry.literalHex)
  const caretLine = $derived(frame.caret[0])
  const caretColumn = $derived(geometry.visual(caretLine, frame.caret[1]))
  const frameFocus = $derived(frame.focus)
  // Like an editor, the caret holds still while it moves and starts blinking once it rests.
  let moving = $state(false)
  $effect(() => {
    void caretLine
    void caretColumn
    moving = true
    const timer = setTimeout(() => { moving = false }, 520)
    return () => clearTimeout(timer)
  })
  const litContext = $derived(readerInspection !== null ? model.classes[readerInspection].context : geometry.contextAt(frame.caret[0], frame.caret[1], frame))

  // Native horizontal scrolling lets the reader explore the whole file. The tour only moves it
  // far enough to keep its current word clear of the faded edge; reading always takes priority.
  $effect(() => {
    void viewportWidth
    const viewport = viewportElement
    if (!viewport || !inView || inside || codeFocused || readerPicker || paused) return
    const cell = parseFloat(getComputedStyle(viewport).getPropertyValue('--editor-ch'))
    const padding = parseFloat(getComputedStyle(viewport.querySelector('.home-editor-plane')!).paddingLeft)
    const column = padding + frameFocus * cell
    const shoulder = Math.min(viewport.clientWidth / 3, cell * 7)
    const left = column > viewport.scrollLeft + viewport.clientWidth - shoulder
      ? column - viewport.clientWidth + shoulder
      : column < viewport.scrollLeft + shoulder ? Math.max(0, column - shoulder) : viewport.scrollLeft
    viewport.scrollTo({ left, behavior: reduceMotion ? 'instant' : 'smooth' })
  })

  function read() {
    touring = false
    paused = true
  }

  function scrollCode(event: KeyboardEvent & { currentTarget: HTMLDivElement }) {
    if (event.target !== event.currentTarget || event.altKey || event.ctrlKey || event.metaKey) return
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    read()
    const viewport = event.currentTarget
    const cell = parseFloat(getComputedStyle(viewport).getPropertyValue('--editor-ch'))
    if (event.key === 'Home' || event.key === 'End') viewport.scrollTo({ left: event.key === 'Home' ? 0 : viewport.scrollWidth, behavior: 'instant' })
    else viewport.scrollBy({ left: (event.key === 'ArrowRight' ? 1 : -1) * cell * 6, behavior: 'instant' })
  }

  /** Custom properties as an inline style. */
  function cssVariables(values: Record<string, string | number>) {
    return Object.entries(values).map(([name, value]) => `${name}: ${value}`).join('; ')
  }

  function rangeStyle(item: EditorClass) {
    const start = geometry.visual(item.line, item.column)
    return cssVariables({ '--editor-anchor-line': item.line, '--editor-from': start, '--editor-to': geometry.visual(item.line, item.column + item.name.length) })
  }

  /** Where an overlay sits: its anchor line and visual column, as CSS variables the stylesheet places by. */
  function anchorStyle(line: number, column: number, extra?: Record<string, string | number>) {
    return cssVariables({ '--editor-anchor-line': line, '--editor-anchor-column': column, ...extra })
  }

  /* One line of markup. Class strings light up when the caret is inside them; every class is a hover target. */

  type LineItem = { key: string, text: string } | { key: string, index: number, accepted?: boolean } | { key: string, typed: string }

  function lineItems(span: { context: number, items: (string | number)[] }, line: number, typed: string, accepted: boolean) {
    const { insertion } = model
    const insertAt = line === insertion.line ? span.items.indexOf(insertion.classIndex) : -1
    const items: LineItem[] = []
    span.items.forEach((item, position) => {
      if (insertAt >= 0 && (position === insertAt - 1 || position === insertAt)) {
        if (position === insertAt && typed) {
          items.push(accepted ? { key: 'typed', index: item as number, accepted: true } : { key: 'typed', typed })
        }
        return
      }
      items.push(typeof item === 'string' ? { key: `text-${position}`, text: item } : { key: `class-${position}`, index: item })
    })
    return items
  }

  type TokenPart = { key: string, swatch: string, editable: boolean } | { key: string, text: string, role: EditorRole }

  function tokenParts(index: number, hex: string) {
    const item = model.classes[index]
    const isLiteral = index === model.literalClass
    const parts: [string, EditorRole][] = isLiteral
      ? [...item.parts.slice(0, item.swatch!.at === 0 ? 0 : item.parts.findIndex(([text]) => text === ':') + 1), ['#', 'base'], [hex.slice(1), 'number']]
      : item.parts
    const children: TokenPart[] = []
    let offset = 0
    parts.forEach(([text, role], position) => {
      if (item.swatch && offset === item.swatch.at) children.push({ key: 'swatch', swatch: isLiteral ? hex : item.swatch.color, editable: isLiteral })
      children.push({ key: String(position), text, role })
      offset += text.length
    })
    return children
  }

  /** The value, or the last one that was not `null`, so a closing overlay keeps its content while it folds away. */
  function last<T>(initial: T) {
    let value = initial
    return (next: T | null) => {
      if (next !== null) value = next
      return value
    }
  }

  /* A soft wash behind the class string that is lit, gliding from string to string with the caret. */
  const lastWash = last({ line: 0, from: 0, to: 0 })
  const washSpan = $derived(litContext === null ? null : geometry.contextSpan(litContext, frame))
  const wash = $derived(lastWash(washSpan))

  /* The language service's hover: the tokens a class uses, then the CSS it generates, in layers. */
  // The model is fixed for the island's life.
  // svelte-ignore state_referenced_locally
  const lastShown = last(model.hoverClass)
  // The last card stays mounted so it can fold away instead of vanishing.
  const shown = $derived(lastShown(hoverIndex))
  const hoverItem = $derived(model.classes[shown])
  const hover = $derived(model.hovers[hoverItem.hover])
  const hoverAbove = $derived(hoverItem.line > model.lines.length / 2)
  const hoverName = $derived(shown === model.literalClass ? hoverItem.name.replace(geometry.literalHex, literalHex) : hoverItem.name)
  // A picked literal changes only the literal in this already-generated rule and its selector.
  const hoverCSS = $derived(shown === model.literalClass ? hover.css.replaceAll(geometry.literalHex.slice(1), literalHex.slice(1)) : hover.css)
  const hoverLines = $derived(hoverCSS.split('\n'))
  const hoverAnimate = $derived(!reduceMotion && visible && inView)

  /** Keyboard scrolling for the small CSS viewport, including browsers without default arrow scrolling. */
  function scrollCSS(event: KeyboardEvent & { currentTarget: HTMLPreElement }) {
    if (event.altKey || event.ctrlKey || event.metaKey || !event.key.startsWith('Arrow')) return
    event.preventDefault()
    const viewport = event.currentTarget.parentElement!
    const step = parseFloat(getComputedStyle(event.currentTarget).lineHeight) * 2
    const left = event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0
    const top = event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0
    viewport.scrollBy({ left, top, behavior: 'instant' })
  }

  /* The completion menu, narrowed by the typed word, with the focused item's detail beside it. */
  const lastWord = last('')
  const word = $derived(lastWord(frame.menu))
  const suggestions = $derived(filterCompletions(model.completion.labels, model.completion.prefix, word))
  const focusedSuggestion = $derived(suggestions[0])
  const detail = $derived(focusedSuggestion?.label === model.completion.label ? model.completion.detail : undefined)
  // The detail reads `(token --name) scope: value`; the docs pane sets each part on its own line.
  const detailToken = $derived(detail?.slice(0, detail.indexOf(')') + 1))
  const definition = $derived(detail?.slice(detail.indexOf(')') + 2))
  const detailScope = $derived(definition?.slice(0, definition.indexOf(': ')))
  const detailValue = $derived(definition?.slice(definition.indexOf(': ') + 2))

  /* The editor's color picker on the literal: the new color, the original to revert to, a plane and two strips. */
  const pickerColor = $derived(literal ?? geometry.literalHSV)
  const pickerHex = $derived(hsvToHex(pickerColor))
  const [hue, saturation, value] = $derived(pickerColor)

  function pick(color: HSV) {
    read()
    readerPicker = true
    readerColor = color
  }

  function escape(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.stopPropagation()
      closePicker()
    }
  }

  function drag(event: PointerEvent & { currentTarget: HTMLElement }, apply: (x: number, y: number) => void) {
    if (!event.isPrimary || event.button !== 0) return
    event.preventDefault()
    const target = event.currentTarget
    const update = (clientX: number, clientY: number) => {
      const rect = target.getBoundingClientRect()
      apply(Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)), Math.min(1, Math.max(0, (clientY - rect.top) / rect.height)))
    }
    target.setPointerCapture(event.pointerId)
    update(event.clientX, event.clientY)
    const move = (moveEvent: PointerEvent) => { if (moveEvent.pointerId === event.pointerId) update(moveEvent.clientX, moveEvent.clientY) }
    const up = (endEvent: PointerEvent) => {
      if (endEvent.pointerId !== event.pointerId) return
      target.removeEventListener('pointermove', move)
      target.removeEventListener('pointerup', up)
      target.removeEventListener('pointercancel', up)
      target.removeEventListener('lostpointercapture', up)
    }
    target.addEventListener('pointermove', move)
    target.addEventListener('pointerup', up)
    target.addEventListener('pointercancel', up)
    target.addEventListener('lostpointercapture', up)
  }

  /* The demo's own pointer; hidden while the reader's pointer is in the window. */
  const lastPointer = last<NonNullable<Frame['pointer']>>({ line: 0, column: 0 })
  const drawnPointer = $derived(inside || (!touring && paused) ? null : frame.pointer)
  const pointer = $derived(lastPointer(drawnPointer))
</script>

{#snippet swatch(color: string, editable: boolean)}
  {#if editable}
    <button aria-label={t('Edit literal color')} class="home-editor-swatch" data-editable="" onclick={openPicker} style:--editor-swatch={color} type="button"></button>
  {:else}
    <span aria-hidden="true" class="home-editor-swatch" style:--editor-swatch={color}></span>
  {/if}
{/snippet}

{#snippet classToken(index: number)}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <span class="home-editor-class" data-editor-class={index} onpointerenter={() => inspect(index)} onpointerleave={() => inspect(null)}>
    {#each tokenParts(index, index === model.literalClass ? literalHex : '') as part (part.key)}
      {#if 'swatch' in part}
        {@render swatch(part.swatch, part.editable)}
      {:else}
        <span data-role={part.role}>{part.text}</span>
      {/if}
    {/each}
  </span>
{/snippet}

{#snippet editorLine(spans: EditorModel['lines'][number], line: number)}
  {@const lineContext = litContext !== null && geometry.contextLine(litContext) === line ? litContext : null}
  {@const typed = line === model.insertion.line ? frame.typed : ''}
  {@const accepted = line === model.insertion.line && frame.accepted}
  {@const lit = spans.some((span) => 'context' in span && span.context === lineContext)}
  {@const indent = 'text' in spans[0] ? spans[0].text.match(/^ +/)?.[0].length ?? 0 : 0}
  <div class="home-editor-line" data-lit={lit ? '' : undefined} style:--editor-indent={indent}>
    {#each spans as span, index (index)}
      {#if 'text' in span}
        <span data-tone={span.tone}>{span.text}</span>
      {:else}
        <span class="home-editor-classes" data-lit={span.context === lineContext ? '' : undefined}>
          {#each lineItems(span, line, typed, accepted) as item (item.key)}
            {#if 'text' in item}
              {item.text}
            {:else if 'typed' in item}
              <span class="home-editor-typed">{item.typed}</span>
            {:else if item.accepted}
              <span>{' '}{@render classToken(item.index)}</span>
            {:else}
              {@render classToken(item.index)}
            {/if}
          {/each}
        </span>
      {/if}
    {/each}
  </div>
{/snippet}

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  bind:this={root}
  class="home-editor-stage"
  data-running={playing ? '' : undefined}
  data-scene={sceneId}
  onfocusout={(event) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) focusHeld = false
  }}
  onfocusin={(event) => { focusHeld = !(event.target as Element).closest('.home-editor-playback') }}
  onpointerover={(event) => { if (event.pointerType !== 'touch') pointerHeld = !(event.target as Element).closest('.home-editor-playback') }}
  onpointerleave={() => { pointerHeld = false }}
 >
  <div class="home-editor-chapters" role="group" aria-label={t('Language service features')}>
    {#each features as feature, index (feature.id)}
      <button
        aria-label={t(feature.title)}
        aria-describedby={`${descriptionId}-${index}`}
        aria-pressed={index === sceneIndex}
        class="home-editor-chapter"
        data-touring={touring && !reduceMotion ? '' : undefined}
        onclick={() => choose(index)}
        type="button">
        <span aria-hidden="true" class="home-editor-chapter-track"><span class="home-editor-chapter-progress" bind:this={progressElements[index]}></span></span>
        <HomeIllustrationArt icon={icons[index]} size={96} />
        <span class="home-editor-chapter-title">{t(feature.title)}</span>
        <span class="home-editor-chapter-body" id={`${descriptionId}-${index}`}>{t(feature.body)}</span>
      </button>
    {/each}
    <!-- Two columns cannot hang a body under each title without holes, so they share one line below. -->
    <div aria-hidden="true" class="home-editor-chapter-note">
      {#each features as feature, index (feature.id)}<p data-active={index === sceneIndex || undefined}>{t(feature.body)}</p>{/each}
    </div>
  </div>
  <p class="sr-only" id={`${descriptionId}-scroll`}>{t('Use the arrow keys to read the file.')}</p>
  <div bind:this={frameElement} class="home-editor-frame home-marks">
    <HomeEditorWindow>
      <HomeEditorBar aria-hidden="true">
        <HomeEditorLights />
        <HomeEditorTab><IconFileCode size={14} stroke={1.75} /><span class="home-editor-file-name">{model.fileName}</span></HomeEditorTab>
        <span class="home-editor-status">{t('Ln {line}, Col {column}').replace('{line}', String(caretLine + 1)).replace('{column}', String(frame.caret[1] + 1))}</span>
      </HomeEditorBar>
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="home-editor-body"
        data-pane={hoverIndex !== null || menuOpen || pickerOpen ? '' : undefined}
        onpointerdown={(event) => {
          read()
          const target = event.target as Element
          if (!target.closest('.home-editor-hover-card, .home-editor-picker')) touchInspected = null
          const token = target.closest<HTMLElement>('[data-editor-class]')
          touchStart = event.pointerType === 'touch' && token ? { index: Number(token.dataset.editorClass), x: event.clientX, y: event.clientY } : null
        }}
        onpointerup={(event) => {
          const start = touchStart
          touchStart = null
          if (start && event.pointerType === 'touch' && Math.hypot(event.clientX - start.x, event.clientY - start.y) < 8) touchInspected = start.index
        }}
        onpointercancel={() => { touchStart = null }}
        onpointerenter={(event) => { if (event.pointerType !== 'touch') inside = true }}
        onpointerleave={(event) => {
          inside = false
          if (!event.currentTarget.contains(document.activeElement)) inspected = null
        }}
        onfocusout={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) codeFocused = false }}
        onfocusin={() => { codeFocused = true }}
        style:--editor-lines={model.lines.length}
        style:--editor-caret-line={caretLine}
        style:--editor-caret-column={caretColumn}>
        <div aria-hidden="true" class="home-editor-gutter">
          {#each model.lines as _, index (index)}<span data-current={index === caretLine ? '' : undefined}>{index + 1}</span>{/each}
        </div>
        <!-- A read-only code viewport needs a keyboard entry point and horizontal navigation. -->
        <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
        <div onkeydown={scrollCode} tabindex={0}
          bind:this={viewportElement}
          aria-describedby={`${descriptionId}-scroll`}
          aria-label={t('Scrollable code example')}
          class="home-editor-viewport"
          onfocusin={read}
          onscroll={(event) => event.currentTarget.parentElement?.style.setProperty('--editor-shift', `${-event.currentTarget.scrollLeft}px`)}
          onwheel={(event) => { if (event.deltaX || event.shiftKey) read() }}
          role="region">
          <div class="home-editor-plane">
            <span aria-hidden="true" class="home-editor-current-line"></span>
            {#each model.lines as spans, line (line)}
              {@render editorLine(spans, line)}
            {/each}
            {#if frame.selecting}
              <span class="home-editor-selection" style={cssVariables({ '--editor-anchor-line': model.insertion.line, '--editor-from': geometry.visual(model.insertion.line, model.insertion.column), '--editor-to': geometry.visual(model.insertion.line, model.insertion.column + frame.typed.length) })}></span>
            {/if}
            <span aria-hidden="true" class="home-editor-context" data-visible={washSpan ? '' : undefined} style={cssVariables({ '--editor-anchor-line': wash.line, '--editor-from': wash.from, '--editor-to': wash.to })}></span>
            {#if hoverIndex !== null}
              <span class="home-editor-hover-range" style={rangeStyle(model.classes[hoverIndex])}></span>
            {/if}
            <span aria-hidden="true" class="home-editor-caret" data-moving={moving ? '' : undefined}></span>
          </div>
        </div>
        <div class="home-editor-overlays" style={pickerStyle}>
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div
            class="home-editor-hover-card home-editor-pane"
            data-above={hoverAbove ? '' : undefined}
            data-open={hoverIndex !== null ? '' : undefined}
            onfocusout={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) inspect(null) }}
            onfocusin={() => inspect(shown)}
            onpointerenter={() => inspect(shown)}
            onpointerleave={(event) => { if (!event.currentTarget.contains(document.activeElement)) inspect(null) }}
            style={anchorStyle(hoverItem.line, geometry.classStart(shown), {
              // The card's height is counted in lines, so its edges fall between lines of code, never through them.
              '--editor-card-lines': hoverLines.length,
              '--editor-card-tokens': hover.tokens.length ? 1 : 0,
              '--editor-room-rows': hoverAbove ? hoverItem.line : model.lines.length - hoverItem.line - 1
            })}>
            <div class="home-editor-hover-heading">
              <code>{#if shown === model.literalClass}{hoverName}{:else}{#each hoverItem.parts as [text, role], part (part)}<span data-role={role}>{text}</span>{/each}{/if}</code>
              <span>CSS</span>
            </div>
            <div class="home-editor-hover-content">
              {#key shown}
                <!-- The generated-CSS viewport is read-only and supports keyboard scrolling. -->
                <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
                <pre tabindex={hoverIndex !== null ? 0 : -1} onkeydown={scrollCSS}
                  aria-label={t('Generated CSS')}
                  class="home-editor-hover-css" data-reveal={hoverAnimate && hoverIndex !== null ? '' : undefined} role="region">{#each hoverLines as cssLine, position (position)}<span class="home-editor-css-line" style:--editor-line-delay={`${Math.min(position, 10) * 18}ms`}>{#each editorCSSParts(cssLine) as [text, role], part (part)}<span data-role={role}>{text}</span>{/each}</span>{/each}</pre>
              {/key}
            </div>
            {#if hover.tokens.length > 0}
              <div class="home-editor-hover-tokens">
                <IconVariable aria-hidden="true" size={14} stroke={1.75} />
                <span class="sr-only">{t('Token')}</span>
                {#each hover.tokens as token (token)}<code>{token}</code>{/each}
              </div>
            {/if}
          </div>
          <div
            class="home-editor-suggest"
            data-open={menuOpen ? '' : undefined}
            style={anchorStyle(model.insertion.line, geometry.visual(model.insertion.line, model.insertion.column + 1), { '--editor-suggest-rows': Math.min(menuRows, suggestions.length) })}>
            <div class="home-editor-pane home-editor-suggest-list">
              <div class="home-editor-suggest-heading"><span>{t('Completions')}</span><span>{suggestions.length}</span></div>
              {#each suggestions.slice(0, menuRows) as item, index (item.label)}
                <div class="home-editor-suggest-item" data-focused={index === 0 ? '' : undefined}>
                  <IconVariable aria-hidden="true" class="home-editor-suggest-icon" size={14} stroke={1.75} />
                  <span class="home-editor-suggest-label">{#each [...item.label] as character, position (position)}{#if item.matches.includes(position)}<b>{character}</b>{:else}{character}{/if}{/each}</span>
                </div>
              {/each}
              {#if suggestions.length > menuRows}
                <span class="home-editor-suggest-scroll" style:--editor-suggest-thumb={menuRows / suggestions.length}></span>
              {/if}
              {#if detail}
                <div class="home-editor-suggest-inline"><IconVariable aria-hidden="true" size={12} stroke={1.75} /><span>{detailToken?.slice(7, -1)}</span></div>
              {/if}
            </div>
            <div class="home-editor-pane home-editor-suggest-docs" data-open={menuOpen && detail ? '' : undefined}>
              <p class="home-editor-suggest-docs-token"><IconVariable aria-hidden="true" size={14} stroke={1.75} />{detailToken?.slice(7, -1)}</p>
              <p class="home-editor-suggest-docs-scope">{detailScope}:</p>
              <!-- Break the value only after its commas, never inside a custom property name. -->
              <p class="home-editor-suggest-docs-value">{#each detailValue?.split(/(?<=,) /) ?? [] as part, index (index)}<span>{index ? ' ' : ''}<span class="home-editor-nowrap">{part}</span></span>{/each}</p>
            </div>
          </div>
          <div
            class="home-editor-pane home-editor-picker"
            aria-label={t('Color picker')}
            data-open={pickerOpen ? '' : undefined}
            inert={!pickerOpen}
            role="dialog"
            style={anchorStyle(geometry.literalSwatch.line, geometry.literalSwatch.column, { '--editor-picker-hue': hue })}>
            <div class="home-editor-picker-header" style:min-height={`${picker.header}px`}>
              <label class="home-editor-picker-new" data-dark={isDark(pickerHex) ? '' : undefined} style:background-color={pickerHex} title={t('Edit literal color')}>
                <input aria-label={t('Literal color')} onchange={(event) => pick(hexToHsv(event.currentTarget.value))} oninput={(event) => pick(hexToHsv(event.currentTarget.value))} onkeydown={escape} type="color" value={pickerHex} />
                <IconColorPicker aria-hidden="true" size={14} stroke={1.75} />
                <span>{pickerHex}</span>
              </label>
              <button aria-label={t('Reset color')} class="home-editor-picker-original" onclick={() => pick(hexToHsv(geometry.literalHex))} onkeydown={escape} style:background-color={geometry.literalHex} title={t('Reset color')} type="button"></button>
              <button aria-label={t('Close color picker')} class="home-editor-picker-close" onclick={() => closePicker()} onkeydown={escape} title={t('Close color picker')} type="button"><IconX aria-hidden="true" size={14} stroke={1.75} /></button>
            </div>
            <div class="home-editor-picker-body" style:padding={`${picker.inset}px`} style:gap={`${picker.gap}px`}>
              <!-- svelte-ignore a11y_no_static_element_interactions -->
              <span
                class="home-editor-picker-plane"
                onpointerdown={(event) => drag(event, (x, y) => pick([hue, x, 1 - y]))}
                style:width={`${picker.plane}px`}
                style:height={`${picker.planeHeight}px`}>
                <span class="home-editor-picker-handle" style:left={`${saturation * 100}%`} style:top={`${(1 - value) * 100}%`} style:background-color={pickerHex}></span>
              </span>
              <!-- svelte-ignore a11y_no_static_element_interactions -->
              <span class="home-editor-picker-hue home-editor-picker-strip" onpointerdown={(event) => drag(event, (_, y) => pick([y * 360, saturation, value]))} style:width={`${picker.strip}px`}>
                <span style:top={`${(hue / 360) * 100}%`}></span>
              </span>
              <span class="home-editor-picker-alpha home-editor-picker-strip" style:width={`${picker.strip}px`} style:--editor-picker-color={pickerHex}>
                <span style:top="0"></span>
              </span>
            </div>
          </div>
          <svg
            class="home-editor-pointer"
            data-instant={pointer.instant ? '' : undefined}
            data-picker={pointer.picker}
            data-pressed={frame.pressed ? '' : undefined}
            data-visible={drawnPointer ? '' : undefined}
            height="20"
            style={anchorStyle(pointer.line, pointer.column, { '--editor-pointer-rows': pointer.rows ?? 0, '--editor-pointer-dx': `${pointer.dx ?? 0}px`, '--editor-pointer-dy': `${pointer.dy ?? 0}px`, '--editor-pointer-u': pointer.u ?? 0, '--editor-pointer-v': pointer.v ?? 0 })}
            viewBox="0 0 20 20"
            width="20">
            <path d="M4 2.5v13.2l3.4-3.2 2.3 5.2 2.4-1-2.3-5.1h4.7z" />
          </svg>
        </div>
      </div>
      <div class="home-editor-footer">
        <span aria-hidden="true" class="home-editor-file-type"><IconFileCode size={14} stroke={1.75} />HTML</span>
        <span aria-hidden="true" class="home-editor-scene"><span>{String(sceneIndex + 1).padStart(2, '0')} / {String(features.length).padStart(2, '0')}</span>{t(features[sceneIndex].label)}</span>
        {#if !reduceMotion}
          <button class="home-editor-playback" onclick={togglePlayback} type="button">
            {#if touring && !paused}
              <IconPlayerPauseFilled aria-hidden="true" size={12} />
            {:else}
              <IconPlayerPlayFilled aria-hidden="true" size={12} />
            {/if}
            {touring && !paused ? t('Pause demo') : t('Play demo')}
          </button>
        {/if}
      </div>
    </HomeEditorWindow>
  </div>
</div>
