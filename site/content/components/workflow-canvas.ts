import { workflowFrameworks, workflowIntegrations, workflowRouteDefinitions, workflowRouteReferences, workflowRoutes } from './workflow-content'
import { drawFrameworks } from './workflow-stage-canvas'
import { drawRepository } from './workflow-repo-canvas'
import { drawRoutes } from './workflow-routes-canvas'
import { drawTrace, traceNodes } from './workflow-trace-canvas'
import { clamp, type Drawing, type Material } from './workflow-painter'
import { workflowReflections, type Reflection } from './workflow-reflections'

export type WorkflowFigure = 'stage' | 'repo' | 'routes' | 'trace'
const painters = { stage: drawFrameworks, repo: drawRepository, routes: drawRoutes, trace: drawTrace }
const periods = { stage: 4.5, repo: 5.8, routes: 6.4, trace: 5.6 }
const stageOrder = [0, 11, 8, 13, 2, 12, 14, 4, 15, 9, 1, 3, 5, 10, 6, 7]

/**
 * Each scene owns its clock and a short flight, then sleeps until the next choice. Hidden tabs,
 * offscreen scenes, explicit pause, pointer and keyboard focus all stop the clock. No perpetual RAF.
 */
export function mountWorkflowCanvas(scene: HTMLElement, canvas: HTMLCanvasElement, figure: WorkflowFigure) {
  const context = canvas.getContext('2d')
  if (!context) return
  const ctx = context
  const glassCanvas = document.createElement('canvas')
  const glassContext = glassCanvas.getContext('2d')
  if (!glassContext) return
  const glass = { canvas: glassCanvas, ctx: glassContext }
  const root = scene.closest<HTMLElement>('.home-wf-figure')!
  const anchors = new Map([...scene.querySelectorAll<HTMLElement>('[data-wf-anchor]')].map((element) => [element.dataset.wfAnchor!, element]))
  const positions = new Map<string, string>()
  const play = scene.querySelector<HTMLButtonElement>('[data-wf-play]')!
  const reduced = matchMedia('(prefers-reduced-motion: reduce)')
  const forced = matchMedia('(forced-colors: active)')
  const scheme = matchMedia('(prefers-color-scheme: dark)')
  let colors: Material
  let reflections: (Reflection | undefined)[] | undefined
  let width = 0, height = 0, density = 1
  const initialRoute = figure === 'routes' ? Number(root.querySelector<HTMLInputElement>('input:checked')?.value ?? 0) : 0
  let active = initialRoute, time = 0, last = 0, lastDraw = 0, frame = 0, timer = 0, idleFrom = 0
  let flightEnd = 0
  let visible = false, paused = false, pinned = false, chosen = initialRoute !== 0, disposed = false, previewed = false
  const unavailable = new Set<EventTarget>()
  let hovered = matchMedia('(hover: hover)').matches && root.matches(':hover')
  let focused = root.contains(document.activeElement)
  let largeType = false
  let dirty = true
  const target = { x: 0, y: 0 }, drift = { x: 0, y: 0 }
  const running = () => visible && !document.hidden && !reduced.matches && !forced.matches && !largeType && !unavailable.size && !hovered && !focused && !paused && !pinned && !chosen

  function anchor(key: string, x: number, y: number, w?: number, h?: number, charge?: number) {
    const element = anchors.get(key)
    if (!element) return
    const signature = `${x.toFixed(2)},${y.toFixed(2)},${w?.toFixed(2)},${h?.toFixed(2)},${charge?.toFixed(3)}`
    if (positions.get(key) === signature) return
    positions.set(key, signature)
    element.style.setProperty('--home-wf-x', `${x.toFixed(2)}px`)
    element.style.setProperty('--home-wf-y', `${y.toFixed(2)}px`)
    if (w !== undefined) element.style.setProperty('--home-wf-w', `${w.toFixed(2)}px`)
    else element.style.removeProperty('--home-wf-w')
    if (h !== undefined) element.style.setProperty('--home-wf-h', `${h.toFixed(2)}px`)
    else element.style.removeProperty('--home-wf-h')
    if (charge !== undefined) element.style.setProperty('--home-wf-charge', charge.toFixed(3))
  }

  function mark() {
    root.dataset.active = String(active)
    scene.dataset.active = String(active)
    const trace = figure === 'trace' ? traceNodes(active) : undefined
    const references = figure === 'routes' ? workflowRouteReferences(workflowRoutes[active].code) : []
    const integration = figure === 'stage' ? workflowFrameworks[active].integration : undefined
    for (const [key, element] of anchors) {
      const [kind, value] = key.split('-')
      const index = Number(value)
      let lit = true
      if (kind === 'framework' || kind === 'project' || kind === 'entry') lit = index === active
      if (kind === 'integration') lit = workflowIntegrations[index].key === integration
      if (kind === 'node') lit = trace!.has(index)
      if (kind === 'definition') lit = references.includes(workflowRouteDefinitions[index].name)
      element.toggleAttribute('data-lit', lit)
      if (kind === 'project') element.setAttribute('aria-pressed', String(index === active))
    }
    if (figure === 'stage') {
      const caption = root.querySelector<HTMLElement>('[data-wf-caption]')
      const node = anchors.get(`framework-${active}`)
      if (caption && node) caption.textContent = `${node.dataset.wfName} → ${workflowIntegrations.find((item) => item.key === integration)!.name}`
    }
    if (figure === 'routes') {
      root.querySelectorAll<HTMLInputElement>('input[type="radio"]').forEach((radio, index) => { radio.checked = index === active })
      root.querySelectorAll<HTMLElement>('[data-sheet]').forEach((sheet, index) => { sheet.hidden = index !== active })
    }
    dirty = true
  }

  function select(index: number, force = false) {
    if (!force && index === active) return
    clearTimer()
    active = index
    time = 0
    flightEnd = 0
    previewed = false
    mark()
    wake()
  }

  function next() {
    if (figure === 'stage') active = stageOrder[(stageOrder.indexOf(active) + 1) % stageOrder.length]
    else if (figure === 'repo') active = (active + 1) % 2
    else if (figure === 'routes') active = (active + 1) % workflowRoutes.length
    time = 0
    flightEnd = 0
    previewed = false
    mark()
  }

  function draw() {
    if (!width || !height || forced.matches || largeType || unavailable.size) return
    ctx.setTransform(density, 0, 0, density, 0, 0)
    ctx.clearRect(0, 0, width, height)
    if (hovered || focused || chosen || pinned) previewed = true
    const drawing: Drawing = { ctx, width, height, density, colors, active, time, endAt: flightEnd, reduced: reduced.matches, previewed, drift, glass, reflections, anchor }
    // Choose the cadence once per choice. A responsive reflow keeps the same arrival and rest.
    const end = painters[figure](drawing)
    if (!flightEnd) flightEnd = end
    if (figure === 'trace') {
      const changed = reduced.matches || hovered || focused || pinned || paused ? 1 : clamp((time - .73) / .38)
      scene.style.setProperty('--home-wf-changed', changed.toFixed(3))
    }
    // The native layout stays visible until the first complete frame and all its anchors are ready.
    scene.dataset.renderer = 'canvas'
    dirty = false
  }

  function tick(now: number) {
    frame = 0
    if (!visible || document.hidden || disposed) return
    const elapsed = last ? Math.min((now - last) / 1000, .1) : 0
    last = now
    const previousTime = time
    if (running()) {
      time += elapsed
      if (time >= periods[figure]) next()
    }
    const settling = Math.abs(drift.x - target.x) + Math.abs(drift.y - target.y) > .005
    if (settling) {
      const amount = reduced.matches ? 1 : 1 - Math.exp(-elapsed * 9)
      drift.x += (target.x - drift.x) * amount
      drift.y += (target.y - drift.y) * amount
    }
    let flying = running() && time < flightEnd
    // Paint the fully settled frame even when a slow frame crosses the end of a flight.
    const landed = running() && previousTime < flightEnd && !flying
    if ((dirty || settling || flying || landed) && (dirty || landed || now - lastDraw > 32)) {
      draw()
      lastDraw = now
    }
    flying = running() && time < flightEnd
    if (settling || flying) frame = requestAnimationFrame(tick)
    else if (running()) {
      const remaining = periods[figure] - time
      idleFrom = performance.now()
      timer = window.setTimeout(() => {
        timer = idleFrom = 0
        next()
        last = 0
        wake()
      }, remaining * 1000)
    }
  }

  function clearTimer() {
    if (timer) {
      // Count the quiet part of a period too, so pausing or changing theme does not restart its delay.
      time = Math.min(periods[figure], time + (performance.now() - idleFrom) / 1000)
      last = 0
    }
    window.clearTimeout(timer)
    timer = idleFrom = 0
  }

  function wake() {
    clearTimer()
    scene.toggleAttribute('data-wf-paused', paused || chosen || pinned)
    play.setAttribute('aria-label', (paused || chosen || pinned ? play.dataset.playLabel : play.dataset.pauseLabel)!)
    if (!frame && visible && !document.hidden && !disposed) frame = requestAnimationFrame(tick)
  }

  function stopClock() {
    cancelAnimationFrame(frame)
    clearTimer()
    frame = timer = last = 0
  }

  function theme() {
    const css = getComputedStyle(canvas)
    colors = {
      ink: css.color, paper: css.backgroundColor, ground: css.columnRuleColor,
      glass: css.borderRightColor, edge: css.borderBottomColor,
      line: css.borderTopColor, quiet: css.caretColor, signal: css.outlineColor,
      light: css.textDecorationColor, shadow: css.getPropertyValue('flood-color'), mono: css.fontFamily, dark: css.colorScheme === 'dark'
    }
    dirty = true
    wake()
  }

  function resize() {
    largeType = parseFloat(getComputedStyle(document.documentElement).fontSize) > 22
    scene.toggleAttribute('data-wf-native', largeType)
    if (largeType) delete scene.dataset.renderer
    const rect = scene.getBoundingClientRect()
    width = rect.width
    height = rect.height
    density = Math.min(devicePixelRatio || 1, 2, Math.sqrt(2_000_000 / Math.max(1, width * height)))
    canvas.width = Math.round(width * density)
    canvas.height = Math.round(height * density)
    glassCanvas.width = glassCanvas.height = 0
    dirty = true
    theme()
    // Resizing clears the bitmap. Repaint now rather than on the next visible frame: mounting starts just
    // outside the viewport, so the scene enters already drawn instead of swapping from its native fallback.
    draw()
  }

  function hold(event: PointerEvent) {
    if (event.pointerType !== 'mouse') return
    hovered = true
    dirty = true
    stopClock()
    wake()
  }
  function release() {
    hovered = false
    target.x = target.y = 0
    last = 0
    if (figure === 'trace' && !pinned && !focused) select(0)
    wake()
  }
  function move(event: PointerEvent) {
    if (event.pointerType !== 'mouse' || reduced.matches) return
    const rect = scene.getBoundingClientRect()
    target.x = clamp((event.clientX - rect.left) / rect.width * 2 - 1, -1, 1)
    target.y = clamp((event.clientY - rect.top) / rect.height * 2 - 1, -1, 1)
    wake()
  }
  function pick(event: Event) {
    if (figure === 'trace' && pinned) return
    const element = (event.target as Element).closest<HTMLElement>('[data-wf-pick]')
    if (!element || !root.contains(element)) return
    select(Number(element.dataset.wfPick))
  }
  function focusIn(event: FocusEvent) {
    if (play.contains(event.target as Node)) return
    focused = true
    dirty = true
    stopClock()
    pick(event)
    wake()
  }
  function focusOut(event: FocusEvent) {
    if (root.contains(event.relatedTarget as Node | null)) return
    focused = false
    delete root.dataset.wfKeyboard
    last = 0
    if (figure === 'trace' && !pinned) select(0)
    wake()
  }
  function change(event: Event) {
    const radio = event.target as HTMLInputElement
    if (radio.type !== 'radio') return
    chosen = true
    select(Number(radio.value), true)
  }
  function scrollCode(event: KeyboardEvent) {
    if (figure !== 'routes' || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
    const viewport = (event.target as Element).closest<HTMLElement>('.home-wf-routes-code')
    if (!viewport || event.target !== viewport || viewport.scrollWidth <= viewport.clientWidth) return
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    // Safari does not scroll a focused read-only region with horizontal arrow keys by default.
    event.preventDefault()
    if (event.key === 'Home') viewport.scrollLeft = 0
    else if (event.key === 'End') viewport.scrollLeft = viewport.scrollWidth
    else viewport.scrollLeft += (event.key === 'ArrowRight' ? 1 : -1) * parseFloat(getComputedStyle(viewport).lineHeight) * 2
  }
  function keydown(event: KeyboardEvent) {
    // WebKit drops :focus-visible when a native radio moves focus with an arrow key.
    // Retain a local keyboard cue; the radio still owns selection and arrow navigation.
    if (figure === 'routes' && (event.target as Element).matches('input[type="radio"]') && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) root.dataset.wfKeyboard = ''
    scrollCode(event)
  }
  function pointerDown() { delete root.dataset.wfKeyboard }
  function click(event: MouseEvent) {
    if (figure === 'routes' && (event.target as Element).matches('input[type="radio"]')) chosen = true
    const element = (event.target as Element).closest<HTMLElement>('[data-wf-pick]')
    if (figure === 'trace' && element) {
      pinned = element.getAttribute('aria-pressed') !== 'true'
      root.querySelectorAll<HTMLElement>('[data-wf-pick]').forEach((node) => node.setAttribute('aria-pressed', String(pinned && node === element)))
      select(Number(element.dataset.wfPick), true)
    } else if (figure === 'repo' && element) {
      chosen = true
      select(Number(element.dataset.wfPick), true)
    }
    wake()
  }
  function toggle() {
    paused = !(paused || chosen || pinned)
    chosen = pinned = false
    // An explicit Play takes effect immediately, including while its button retains keyboard focus.
    hovered = focused = false
    root.querySelectorAll<HTMLElement>('[data-node]').forEach((node) => node.setAttribute('aria-pressed', 'false'))
    if (figure === 'trace' && !paused) select(0, true)
    stopClock()
    wake()
  }
  function visibility() {
    stopClock()
    if (!document.hidden) { dirty = true; wake() }
  }
  function motion() {
    target.x = target.y = drift.x = drift.y = 0
    stopClock()
    if (forced.matches) delete scene.dataset.renderer
    dirty = true
    wake()
  }
  function contextLost(event: Event) {
    unavailable.add(event.currentTarget!)
    stopClock()
    delete scene.dataset.renderer
  }
  function contextRestored(event: Event) {
    unavailable.delete(event.currentTarget!)
    if (!unavailable.size) resize()
  }

  const intersection = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting
    stopClock()
    if (visible) { dirty = true; wake() }
  }, { threshold: .1 })
  const resizeObserver = new ResizeObserver(resize)
  const themeObserver = new MutationObserver(theme)
  intersection.observe(scene)
  resizeObserver.observe(scene)
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style'] })
  const listeners = { pointerenter: hold, pointerleave: release, pointermove: move, pointerover: pick, pointerdown: pointerDown, focusin: focusIn, focusout: focusOut, change, click, keydown }
  for (const [name, listener] of Object.entries(listeners)) root.addEventListener(name, listener as EventListener)
  play.addEventListener('click', toggle)
  for (const surface of [canvas, glassCanvas]) {
    surface.addEventListener('contextlost', contextLost)
    surface.addEventListener('contextrestored', contextRestored)
  }
  document.addEventListener('visibilitychange', visibility)
  document.fonts.ready.then(() => { if (!disposed) { dirty = true; wake() } })
  reduced.addEventListener('change', motion)
  forced.addEventListener('change', motion)
  scheme.addEventListener('change', theme)
  mark()
  resize()
  if (figure === 'stage') workflowReflections(scene).then((images) => {
    if (disposed) return
    reflections = images
    dirty = true
    wake()
  })

  return () => {
    disposed = true
    stopClock()
    intersection.disconnect()
    resizeObserver.disconnect()
    themeObserver.disconnect()
    for (const [name, listener] of Object.entries(listeners)) root.removeEventListener(name, listener as EventListener)
    play.removeEventListener('click', toggle)
    for (const surface of [canvas, glassCanvas]) {
      surface.removeEventListener('contextlost', contextLost)
      surface.removeEventListener('contextrestored', contextRestored)
    }
    document.removeEventListener('visibilitychange', visibility)
    reduced.removeEventListener('change', motion)
    forced.removeEventListener('change', motion)
    scheme.removeEventListener('change', theme)
    delete scene.dataset.renderer
    delete root.dataset.wfKeyboard
  }
}
