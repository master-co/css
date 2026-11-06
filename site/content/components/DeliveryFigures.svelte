<script lang="ts">
  import { onMount } from 'svelte'
  import IconPlayerPauseFilled from '@tabler/icons-svelte-runes/icons/player-pause-filled'
  import IconPlayerPlayFilled from '@tabler/icons-svelte-runes/icons/player-play-filled'
  import IconRotate from '@tabler/icons-svelte-runes/icons/rotate'
  import { getSite } from '@master/internal-site/site'
  import { deliveryEnd, deliveryExplanations, deliveryMoments, deliveryRuleAt, deliveryTiming, type DeliveryMode } from './delivery-content'

  /**
   * Give each cause and result time to register, then hold the finished mode for comparison.
   * Browser tests may set `window.__masterDeliverySpeed` before the island loads to run the same
   * timeline faster; visitors always get real time.
   */
  const speed = typeof window === 'undefined' ? 1 : Math.max(1, Number((window as { __masterDeliverySpeed?: unknown }).__masterDeliverySpeed) || 1)
  const unit = 4200 / speed
  const rest = 4800 / speed
  /** How far ahead of its moment, in timeline units, a flight leaves so it lands on time. */
  const rainLead = 0.32
  const carryLead = 0.36

  type Playback = 'playing' | 'paused' | 'ended'

  interface Controls {
    seek: (moment: number) => void
    toggle: () => void
  }

  /**
   * The Rendering section's timeline: template, CSS and first paint, which the stage plays for
   * the chosen mode. While in view the section tours the modes; pointer or focus inside
   * holds the current mode, and choosing a mode or a moment ends the tour. The stage is server-rendered
   * at its last moment; this island writes `--home-delivery-t` and flies class glyphs and files between
   * the stations. Reduced motion keeps the last moment and lets the moments be chosen directly.
   */
  let { sectionId }: { sectionId: string } = $props()
  const { t: translate } = getSite()
  let moment = $state(deliveryEnd - 1)
  let playback = $state<Playback>('ended')
  let motion = $state(false)
  let ready = $state(false)
  let controls: Controls | undefined
  const setMoment = (value: number) => { moment = value }
  const setPlayback = (value: Playback) => { playback = value }
  const setMotion = (value: boolean) => { motion = value }
  const setReady = (value: boolean) => { ready = value }

  onMount(() => {
    const section = document.getElementById(sectionId)
    const stage = section?.querySelector<HTMLElement>('.home-delivery-stage')
    const frame = section?.querySelector<HTMLElement>('.home-delivery-figure')
    const layer = stage?.querySelector<HTMLElement>('.home-delivery-flights')
    const routes = stage?.querySelector<SVGSVGElement>('.home-delivery-routes')
    const inspectButtons = stage ? [...stage.querySelectorAll<HTMLButtonElement>('[data-inspect-css], [data-reveal-css]')] : []
    const previewHost = stage?.querySelector<HTMLElement>('[data-preview-host]')
    const preview = previewHost?.shadowRoot
    const sample = preview?.querySelector<HTMLElement>('[data-preview-sample]')
    const radios = section ? [...section.querySelectorAll<HTMLInputElement>('input[name="home-delivery-mode"]')] : []
    if (!section || !stage || !frame || !layer || !routes || !inspectButtons.length || !preview || !sample || !radios.length) return
    const preference = matchMedia('(prefers-reduced-motion: reduce)')
    let reduce = preference.matches

    let t: number = deliveryEnd
    let shown = deliveryEnd - 1
    let playing = false
    let touring = !reduce && !radios.some(radio => radio.checked !== radio.defaultChecked)
    let scrubbed = false
    let hovered = frame.matches(':hover')
    let focused = frame.matches(':focus-within')
    let visible = false
    let inView = false
    let clock = 0
    let visibleClock = 0
    let endedAt = 0
    let releasedAt = 0
    let last = 0
    let frameId = 0
    let filmMode = ''
    let begun = false
    let tween: { from: number, to: number, elapsed: number, moment: number } | undefined
    let events: { at: number, run: () => void }[] = []
    const animations = new Set<Animation>()
    const timers = new Set<{ at: number, run: () => void }>()

    const mode = () => (radios.find((radio) => radio.checked)?.value ?? 'static') as DeliveryMode
    const ruleStyles = [...preview.querySelectorAll<HTMLStyleElement>('style[data-delivery-rule]')].map(style => ({ style, className: style.dataset.deliveryRule!, text: `@layer utilities{${style.dataset.ruleText}}` }))
    let previewKey = ''
    const cues = [...stage.querySelectorAll<HTMLElement>('[data-cue-at]')].map(element => ({ element, at: Number(element.dataset.cueAt), shown: undefined as boolean | undefined }))
    const codeDocuments = [...stage.querySelectorAll('.home-delivery-code')].map(document => [...document.querySelectorAll<HTMLElement>('.home-delivery-code-row')].map(row => ({ row, label: row.querySelector('.home-delivery-line-number')!, at: Number(row.dataset.lineAt), present: undefined as boolean | undefined })))
    const updateRows = () => {
      let changed = false
      for (const rows of codeDocuments) {
        let documentChanged = false
        for (const item of rows) {
          const present = t >= item.at
          if (item.present === present) continue
          item.present = present
          item.row.style.display = present ? '' : 'none'
          documentChanged = true
        }
        if (documentChanged) {
          let number = 0
          for (const item of rows) if (item.present) item.label.textContent = String(++number)
          changed = true
        }
      }
      for (const cue of cues) {
        const shown = t >= cue.at
        if (shown !== cue.shown) {
          cue.shown = shown
          cue.element.setAttribute('aria-hidden', String(!shown))
        }
      }
      return changed
    }
    const updatePreview = () => {
      const current = mode()
      const timing = deliveryTiming[current]
      // Delivered stylesheets arrive whole; runtime rules apply one by one as the engine writes them.
      const key = `${current}|${ruleStyles.map(({ className: rule }) => t >= (current === 'runtime' ? deliveryRuleAt(current, rule) : timing.sheet) ? '1' : '0').join('')}`
      if (key === previewKey) return false
      previewKey = key
      const availability = key.slice(key.lastIndexOf('|') + 1)
      ruleStyles.forEach(({ style, text }, index) => {
        const next = availability[index] === '1' ? text : ''
        if (style.textContent !== next) style.textContent = next
      })
      return true
    }
    const syncAnimations = () => {
      for (const animation of animations) {
        if (playing && visible) animation.play()
        else animation.pause()
      }
    }
    const setPlaying = (value: boolean) => {
      playing = value
      syncAnimations()
      stage.toggleAttribute('data-playing', value)
      setPlayback(value ? 'playing' : t >= deliveryEnd ? 'ended' : 'paused')
    }
    const setT = (value: number) => {
      t = Math.min(deliveryEnd, Math.max(0, value))
      stage.style.setProperty('--home-delivery-t', t.toFixed(3))
      const previewChanged = updatePreview()
      const changed = updateRows()
      if (changed || previewChanged) drawRoutes()
      const next = tween?.moment ?? Math.min(deliveryEnd - 1, Math.max(0, Math.ceil(t - 0.0001) - 1))
      if (next !== shown) {
        shown = next
        stage.dataset.moment = String(next)
        setMoment(next)
      }
    }
    const later = (callback: () => void, delay: number) => {
      timers.add({ at: clock + delay, run: callback })
    }

    /* Flights: decorative copies that travel over the stage; they never touch its layout. */
    const belongs = (element: Element) => {
      const variant = element.closest<HTMLElement>('.home-delivery-variant')
      return !variant || !!variant.dataset.mode?.split(' ').includes(mode())
    }
    const isShown = (element: Element | null): element is HTMLElement => {
      if (!(element instanceof HTMLElement) || getComputedStyle(element).visibility !== 'visible') return false
      const variant = element.closest<HTMLElement>('.home-delivery-variant')
      if (variant && !variant.dataset.mode?.split(' ').includes(mode())) return false
      const rect = element.getBoundingClientRect()
      return rect.width > 0 && rect.height > 0
    }
    const find = (scope: ParentNode, selector: string) => [...scope.querySelectorAll(selector)].find(isShown)
    const local = (element: Element) => {
      const box = layer.getBoundingClientRect()
      const rect = element.getBoundingClientRect()
      return { x: rect.left - box.left, y: rect.top - box.top, width: rect.width, height: rect.height }
    }
    const track = (animation: Animation, element: HTMLElement) => {
      animations.add(animation)
      if (!playing || !visible) animation.pause()
      animation.finished.catch(() => undefined).finally(() => {
        animations.delete(animation)
        element.remove()
      })
    }
    /** A ripple leaves the ring as a rule is written. */
    const pulse = (ring: HTMLElement) => {
      const box = local(ring)
      const ripple = document.createElement('span')
      ripple.dataset.flight = 'ripple'
      Object.assign(ripple.style, { left: `${box.x}px`, top: `${box.y}px`, width: `${box.width}px`, height: `${box.height}px` })
      layer.append(ripple)
      track(ripple.animate([{ scale: '1', opacity: 0.9 }, { scale: '1.32', opacity: 0 }], { duration: 640, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'both' }), ripple)
    }

    /** Every capsule stays on the measured rail; code is highlighted at its actual word. */
    const flight = (label: string, kind: 'class' | 'packet' | 'rule', route: 'input' | 'rules' | 'paint', duration: number, target?: HTMLElement) => {
      const path = routes.querySelector<SVGPathElement>(`[data-route="${route}"]`)
      if (!path?.hasAttribute('d') || path.getTotalLength() < 1) return
      const chip = document.createElement('span')
      chip.dataset.flight = kind
      chip.textContent = label
      layer.append(chip)
      const width = chip.offsetWidth
      const height = chip.offsetHeight
      const pathBox = routes.getBoundingClientRect()
      const layerBox = layer.getBoundingClientRect()
      const length = path.getTotalLength()
      const frames: Keyframe[] = []
      for (let index = 0; index <= 24; index++) {
        const progress = index / 24
        const point = path.getPointAtLength(length * progress)
        frames.push({ transform: `translate(${point.x + pathBox.left - layerBox.left - width / 2}px, ${point.y + pathBox.top - layerBox.top - height / 2}px)`, opacity: Math.min(1, progress * 8, target ? 1 : (1 - progress) * 8), offset: progress * (target ? .75 : 1) })
      }
      if (target) {
        const landing = target.getBoundingClientRect()
        const transform = `translate(${landing.left - layerBox.left + landing.width / 2 - width / 2}px, ${landing.top - layerBox.top + landing.height / 2 - height / 2}px)`
        frames.push({ transform, opacity: 1, offset: .92 }, { transform, opacity: 0, offset: 1 })
      }
      track(chip.animate(frames, { duration, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'both' }), chip)
    }
    const rain = (className: string, line: HTMLElement) => {
      if (!belongs(line)) return
      const engine = find(stage, `[data-ring="${line.dataset.engine}"]`)
      const ring = engine?.querySelector<HTMLElement>('.home-delivery-engine-core')
      if (!ring) return
      const scope = find(stage, `[data-carry-source="${line.dataset.glyphSource}"]`)
      const source = scope && find(scope, `[data-glyph="${className}"]`)
      if (source) {
        source.dataset.hot = ''
        later(() => delete source.dataset.hot, unit / 3)
      }
      const duration = Math.max(140, (Number(line.dataset.at) - t) * unit)
      const inputTime = Math.min(duration * .62, deliveryTiming[mode()].step * unit * .9)
      flight(className, 'class', 'input', inputTime)
      later(() => {
        pulse(ring)
        flight('', 'rule', 'rules', duration - inputTime)
      }, inputTime)
    }
    const carry = (label: string, target: HTMLElement) => {
      if (!isShown(target)) return
      flight(label, 'packet', 'paint', Math.max(180, Number(target.dataset.lead ?? carryLead) * unit))
    }

    const cancel = () => {
      for (const animation of animations) animation.cancel()
      animations.clear()
      timers.clear()
      stage.querySelectorAll<HTMLElement>('[data-hot]').forEach((element) => delete element.dataset.hot)
      layer.replaceChildren()
    }
    const collect = () => {
      events = []
      stage.querySelectorAll<HTMLElement>('[data-land]').forEach((line) => {
        if (!belongs(line)) return
        const at = Number(line.dataset.at) - rainLead
        events.push({ at, run: () => rain(line.dataset.land!, line) })
      })
      stage.querySelectorAll<HTMLElement>('[data-carry]').forEach((target) => {
        if (!isShown(target)) return
        events.push({ at: Number(target.dataset.at) - Number(target.dataset.lead ?? carryLead), run: () => carry(target.dataset.carry!, target) })
      })
    }
    const advance = (to: number) => {
      // On a film's first frame, flights that had to leave before it (to land early in the build) leave at once.
      const from = begun ? t : -Infinity
      begun = true
      setT(to)
      if (!reduce) for (const event of events) if (event.at > from && event.at <= to) event.run()
    }
    const film = () => {
      cancel()
      stage.removeAttribute('data-inspecting')
      stage.querySelectorAll('.home-delivery-code-scroll').forEach((scroll) => { scroll.scrollTop = 0 })
      filmMode = mode()
      begun = false
      clock = 0
      scrubbed = false
      tween = undefined
      setT(0)
      collect()
      setPlaying(true)
      redraw()
    }

    const tick = (now: number) => {
      // Offscreen and hidden figures release the frame loop; becoming visible starts it again.
      if (!visible) {
        frameId = 0
        return
      }
      frameId = requestAnimationFrame(tick)
      const elapsed = last ? Math.min(now - last, 64) : 0
      last = now
      visibleClock += elapsed
      if (tween) {
        tween.elapsed += elapsed
        const progress = Math.min(1, tween.elapsed / 620)
        const eased = 1 - (1 - progress) ** 3
        setT(tween.from + (tween.to - tween.from) * eased)
        if (progress >= 1) {
          tween = undefined
          setPlayback(t >= deliveryEnd ? 'ended' : 'paused')
        }
        return
      }
      if (playing) {
        clock += elapsed
        for (const timer of timers) {
          if (timer.at > clock) continue
          timers.delete(timer)
          timer.run()
        }
        advance(t + elapsed / unit)
        if (t >= deliveryEnd) {
          endedAt = visibleClock
          setPlaying(false)
        }
      } else if (touring && t >= deliveryEnd && !hovered && !focused && visibleClock - Math.max(endedAt, releasedAt) > rest) {
        const index = radios.findIndex((radio) => radio.checked)
        radios[(index + 1) % radios.length].checked = true
        film()
      }
    }

    const choose = (fromClick: boolean) => {
      touring = false
      stage.removeAttribute('data-touring')
      stage.removeAttribute('data-inspecting')
      const next = mode()
      if (next === filmMode && !fromClick) return
      if (reduce || scrubbed) {
        cancel()
        filmMode = next
        updatePreview()
        collect()
        redraw()
      } else {
        film()
      }
    }
    const focusCode = (selector: string) => {
      const line = find(stage, selector)
      const scroll = line?.closest<HTMLElement>('.home-delivery-code-scroll')
      if (line && scroll) {
        const row = line.getBoundingClientRect()
        const view = scroll.getBoundingClientRect()
        if (row.top < view.top + 44 || row.bottom > view.bottom - 44) scroll.scrollTop += row.top - view.top - view.height * .42
      }
    }
    const onInspect = (event: Event) => {
      touring = false
      stage.removeAttribute('data-touring')
      cancel()
      tween = undefined
      setPlaying(false)
      if (t < deliveryTiming[mode()].reference + .15) setT(Math.max(2, deliveryTiming[mode()].reference + .2))
      const toCSS = (event.currentTarget as HTMLElement).hasAttribute('data-reveal-css')
      if (!toCSS) focusCode('[data-reference-line]')
      stage.setAttribute('data-inspecting', '')
      const target = toCSS ? find(stage, '.home-delivery-css .home-delivery-code-scroll') : find(stage, '[data-reference-line]')?.closest<HTMLElement>('.home-delivery-code-scroll')
      target?.focus({ preventScroll: true })
      target?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reduce ? 'instant' : 'smooth' })
      redraw()
    }
    const onClick = () => choose(true)
    const onChange = () => choose(false)
    inspectButtons.forEach(button => button.addEventListener('click', onInspect))
    radios.forEach((radio) => {
      radio.addEventListener('click', onClick)
      radio.addEventListener('change', onChange)
    })

    controls = {
      seek(index) {
        touring = false
        stage.removeAttribute('data-touring')
        stage.removeAttribute('data-inspecting')
        scrubbed = true
        begun = true
        cancel()
        setPlaying(false)
        if (reduce) setT(index + 1)
        else tween = { from: t, to: index + 1, elapsed: 0, moment: index }
        shown = index
        stage.dataset.moment = String(index)
        setMoment(index)
        if (index === 1) focusCode('[data-reference-line]')
        else if (index === 0) stage.querySelectorAll('.home-delivery-template .home-delivery-code-scroll').forEach(scroll => { scroll.scrollTop = 0 })
        redraw()
      },
      toggle() {
        touring = false
        stage.removeAttribute('data-touring')
        if (playing) {
          setPlaying(false)
        } else if (t >= deliveryEnd) {
          film()
        } else {
          scrubbed = false
          tween = undefined
          collect()
          setPlaying(true)
        }
      }
    }

    // A pointer or focus inside the figure holds automatic mode changes while the film continues.
    const inside = (node: EventTarget | null) => node instanceof Node && (frame.contains(node) || radios.includes(node as HTMLInputElement))
    const hold = (event: Event) => {
      if (event.type === 'pointerenter') hovered = true
      else focused = true
    }
    const release = (event: Event) => {
      if (event instanceof FocusEvent && inside(event.relatedTarget)) return
      if (event.type === 'pointerleave') hovered = false
      else focused = false
      releasedAt = visibleClock
    }
    frame.addEventListener('pointerenter', hold)
    frame.addEventListener('pointerleave', release)
    frame.addEventListener('focusin', hold)
    frame.addEventListener('focusout', release)
    radios.forEach((radio) => {
      radio.addEventListener('focus', hold)
      radio.addEventListener('blur', release)
    })
    const updateVisibility = () => {
      visible = inView && !document.hidden
      stage.toggleAttribute('data-visible', visible)
      syncAnimations()
      last = 0
      if (visible && !frameId) frameId = requestAnimationFrame(tick)
    }
    // Notifications batch while layout settles; the last entry is the current state.
    const intersection = new IntersectionObserver((entries) => {
      const entry = entries[entries.length - 1]
      inView = entry.isIntersecting
      updateVisibility()
    }, { threshold: 0.2 })
    intersection.observe(stage)
    document.addEventListener('visibilitychange', updateVisibility)

    const onPreference = () => {
      reduce = preference.matches
      touring = false
      stage.removeAttribute('data-touring')
      cancel()
      tween = undefined
      setT(deliveryEnd)
      setPlaying(false)
      setMotion(!reduce)
    }
    preference.addEventListener('change', onPreference)
    const drawRoutes = () => {
      // A queued observer can outlive development hot replacement of the static workbench.
      if (!stage.isConnected) return
      const bounds = routes.getBoundingClientRect()
      const stations = ['template', 'css', 'browser', 'process'].map(name => stage.querySelector<HTMLElement>(`[data-station="${name}"]`))
      const core = find(stage, '.home-delivery-engine-core')
      if (!bounds.width || stations.some(station => !station) || !core) return
      const [template, css, browser, processor] = stations.map(station => {
        const rect = station!.getBoundingClientRect()
        return { x: rect.left - bounds.left, y: rect.top - bounds.top, right: rect.right - bounds.left, bottom: rect.bottom - bounds.top, cx: rect.left - bounds.left + rect.width / 2, cy: rect.top - bounds.top + rect.height / 2 }
      })
      const box = core.getBoundingClientRect()
      const ring = { x: box.left - bounds.left, y: box.top - bounds.top, right: box.right - bounds.left, bottom: box.bottom - bounds.top, cx: box.left - bounds.left + box.width / 2, cy: box.top - bounds.top + box.height / 2 }
      const horizontal = processor.x > template.x
      const inputY = Math.min(template.bottom - 28, ring.cy - 20)
      const cssTab = find(stage, '.home-delivery-css .home-editor-tab')!.getBoundingClientRect()
      const cssCode = stage.querySelector('.home-delivery-css .home-delivery-code-stack')!.getBoundingClientRect()
      const inputLabel = stage.querySelector('[data-flow-label="input"]')!.getBoundingClientRect()
      const outputLabel = stage.querySelector('[data-flow-label="output"]')!.getBoundingClientRect()
      const outputY = cssTab.top - bounds.top + cssTab.height / 2
      const deliveryY = cssCode.top - bounds.top + 16
      const sampleBox = sample.getBoundingClientRect()
      // Deliveries land low on the card's edge, where the route clears the engine label above it.
      const landing = { x: sampleBox.left - bounds.left - 8, y: sampleBox.bottom - bounds.top - 28 }
      const paths = horizontal ? {
        input: `M${template.right} ${inputY}C${ring.x - 14} ${inputY} ${ring.x - 14} ${ring.cy} ${ring.x} ${ring.cy}`,
        rules: `M${ring.x} ${ring.cy + 9}C${ring.x - 14} ${ring.cy + 9} ${ring.x - 14} ${outputY} ${css.right} ${outputY}`,
        paint: `M${css.right} ${deliveryY}C${ring.right + 12} ${deliveryY} ${ring.right + 12} ${landing.y} ${landing.x} ${landing.y}`
      } : {
        input: `M${Math.min(inputLabel.right - bounds.left + 8, ring.x - 8)} ${ring.cy}H${ring.x}`,
        rules: `M${ring.right} ${ring.cy}H${Math.max(outputLabel.left - bounds.left - 8, ring.right + 8)}`,
        paint: `M${ring.cx} ${processor.bottom + 1}V${browser.y + 24}`
      }
      routes.setAttribute('viewBox', `0 0 ${bounds.width} ${bounds.height}`)
      for (const [name, path] of Object.entries(paths)) routes.querySelector(`[data-route="${name}"]`)?.setAttribute('d', path)
      stage.setAttribute('data-routed', '')
    }
    const redraw = () => { cancel(); drawRoutes() }
    const resize = new ResizeObserver(redraw)
    resize.observe(layer)
    const scrolls = [...stage.querySelectorAll<HTMLElement>('.home-delivery-code-scroll')]
    const onCodeFocus = () => {
      touring = false
      stage.removeAttribute('data-touring')
      tween = undefined
      setPlaying(false)
      cancel()
    }
    // The panes never scroll under the wheel or a swipe, so the page keeps them; a focused pane reads with the keys.
    const readCode = (event: KeyboardEvent) => {
      const scroll = event.currentTarget as HTMLElement
      if (event.target !== scroll || event.altKey || event.ctrlKey || event.metaKey) return
      if (event.key === 'Home' || event.key === 'End') {
        event.preventDefault()
        scroll.scrollTo({ top: event.key === 'Home' ? 0 : scroll.scrollHeight, behavior: 'instant' })
        return
      }
      const step = (scroll.querySelector<HTMLElement>('.home-delivery-code-row')?.offsetHeight ?? 20) * 2
      const page = scroll.clientHeight * 0.85
      const move = ({ ArrowDown: [0, step], ArrowUp: [0, -step], ArrowRight: [step, 0], ArrowLeft: [-step, 0], PageDown: [0, page], PageUp: [0, -page], ' ': [0, event.shiftKey ? -page : page] } as Record<string, [number, number]>)[event.key]
      if (!move) return
      event.preventDefault()
      scroll.scrollBy({ left: move[0], top: move[1], behavior: 'instant' })
    }
    scrolls.forEach(scroll => scroll.addEventListener('focus', onCodeFocus))
    scrolls.forEach(scroll => scroll.addEventListener('pointerdown', onCodeFocus))
    scrolls.forEach(scroll => scroll.addEventListener('keydown', readCode))

    filmMode = mode()
    collect()
    setReady(true)
    inspectButtons.forEach(button => { button.disabled = false })
    updatePreview()
    updateRows()
    if (!reduce) {
      setMotion(true)
      if (scrolls.some(scroll => scroll.matches(':focus-within'))) onCodeFocus()
      else {
        stage.toggleAttribute('data-touring', touring)
        setT(0)
        setPlaying(true)
      }
    }
    frameId = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frameId)
      cancel()
      intersection.disconnect()
      resize.disconnect()
      scrolls.forEach(scroll => scroll.removeEventListener('focus', onCodeFocus))
      scrolls.forEach(scroll => scroll.removeEventListener('pointerdown', onCodeFocus))
      scrolls.forEach(scroll => scroll.removeEventListener('keydown', readCode))
      stage.removeAttribute('data-routed')
      inspectButtons.forEach(button => { button.removeEventListener('click', onInspect); button.disabled = true })
      preference.removeEventListener('change', onPreference)
      document.removeEventListener('visibilitychange', updateVisibility)
      frame.removeEventListener('pointerenter', hold)
      frame.removeEventListener('pointerleave', release)
      frame.removeEventListener('focusin', hold)
      frame.removeEventListener('focusout', release)
      radios.forEach((radio) => {
        radio.removeEventListener('click', onClick)
        radio.removeEventListener('change', onChange)
        radio.removeEventListener('focus', hold)
        radio.removeEventListener('blur', release)
      })
      controls = undefined
    }
  })

  const playLabel = $derived(playback === 'playing' ? translate('Pause') : playback === 'ended' ? translate('Replay') : translate('Play'))
</script>

<div class="home-delivery-player">
  <!-- Every state renders on the server: the page runs on prerendered CSS, so a class that first appears in the browser would have no rule. -->
  <!-- The page lamp writes its light onto the play button before or after hydration. -->
  <button aria-label={playLabel} class="home-delivery-play home-lit home-stone home-stone-button home-stone-quiet" data-playback={playback} hidden={!motion} onclick={() => controls?.toggle()} title={playLabel} type="button">
    <IconPlayerPauseFilled aria-hidden="true" data-icon="playing" size={12} stroke={1.75} />
    <IconPlayerPlayFilled aria-hidden="true" data-icon="paused" size={12} stroke={1.75} />
    <IconRotate aria-hidden="true" data-icon="ended" size={13} stroke={1.75} />
  </button>
  <div aria-label={translate('Timeline')} class="home-delivery-timeline" role="group">
    {#each deliveryMoments as item, index (item.id)}
      <button aria-pressed={moment === index} class="home-delivery-moment" disabled={!ready} onclick={() => controls?.seek(index)} style:--i={index} type="button">
        <span class="home-delivery-moment-label">{translate(item.label)}</span>
        <span aria-hidden="true" class="home-delivery-moment-track">
          <span class="home-delivery-moment-fill"></span>
        </span>
      </button>
    {/each}
  </div>
  <div class="home-delivery-explanations">
    {#each Object.entries(deliveryExplanations) as [mode, chapters] (mode)}
      <p class="home-delivery-explanation home-delivery-variant" data-mode={mode}>{#each chapters as chapter, index (chapter)}<span data-explanation-moment={index}>{translate(chapter)}</span>{/each}</p>
    {/each}
  </div>
</div>
