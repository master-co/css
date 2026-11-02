import { backingDensity, ctaLitProperties, litValues, type Box, type Lamp } from './cta-light'

interface Thread { lane: number, near: number, gold: boolean, weight: number, rest: Float32Array }
interface Ripple { x: number, y: number, started: number }
interface LitControl extends Box { element: HTMLElement, values: string[], text?: boolean }
interface Palette { gold: string, stone: string, glint: string, dark: boolean }

/** Segments per thread, so a glint can run along it. */
const segments = 64
const stride = (segments + 1) * 3
/** The root sits this far down the field, matching the CSS bead (`.home-cta-field::before`). */
const rootAt = 0.09
const rows = 12
const revealDuration = 1900
// The field waits on its bead until this much of the canvas is in view, so the reader sees it open.
const revealThreshold = 0.38
const rippleDuration = 1600
/** Glints are drawn in this many brightness steps, one path each, instead of a stroke per segment. */
const glintLevels = 14
const litSelector = '.home-cta-actions > *'
const titleSelector = '.home-cta-title-finish'

/**
 * The closing field: fine threads fall from one gold point beneath the invitation and fan out across
 * the ground, gold silk alternating with threads of the page's stone, a few transverse curves showing
 * the surface they make. The fan is the near half of a bell, so its middle threads come toward the
 * viewer. Each thread is lit as a fine fiber by the close's lamp: its sheen runs along the thread where
 * the thread turns across the light, so the satin of the hero's silk lies as a band across the fan
 * and slides as the lamp moves. The same lamp lights the cut-stone title and the actions through the
 * hero's `--lit-*` and `--cast-*` properties. The field draws only while something changes, then sleeps.
 */
export function mountCTAField(host: HTMLElement, canvas: HTMLCanvasElement) {
  let drawing: CanvasRenderingContext2D | null = null
  try {
    drawing = canvas.getContext('2d')
  } catch {
    // The invitation, its controls and the CSS starting point remain complete without Canvas.
  }
  if (!drawing) return
  const context = drawing
  const actions = host.querySelector<HTMLElement>('.home-cta-actions')
  const motion = matchMedia('(prefers-reduced-motion: reduce)')
  const contrast = matchMedia('(forced-colors: active)')
  const print = matchMedia('print')
  const scheme = matchMedia('(prefers-color-scheme: dark)')

  let disposed = false, visible = false, dirty = true, inView = false, ready = false
  let frame = 0, previous = -1, started = -1, reveal = 0
  let width = 0, height = 0, density = 1
  let threads: Thread[] = []
  let points = new Float32Array(0)
  let waves = new Float32Array(0)
  let levels = new Uint8Array(0)
  // Near the root the threads crowd closer than a pixel apart; their sheen is thinned there, so light
  // added thread by thread never burns the gathered warp white.
  let crowd = new Float32Array(segments)
  let palette: Palette = { gold: '', stone: '', glint: '', dark: false }
  let ripples: Ripple[] = []
  let lit: LitControl[] = []
  let poolValues = ['', '']
  // The canvas sits inside the invitation; the lamp and the controls use the invitation's coordinates.
  const offset = { x: 0, y: 0 }
  const rest: Lamp = { x: 0, y: 0, z: 1 }
  const lamp: Lamp & { placed: boolean } = { x: 0, y: 0, z: 1, placed: false }
  const aim = { source: 'rest' as 'rest' | 'pointer' | 'focus', clientX: 0, clientY: 0, focusX: 0, focusY: 0 }
  const carry = { value: 0, target: 0 }
  let lowZ = 160
  // How brightly the resting lamp reaches the middle of the field; light is measured against it, so the
  // field is exposed alike on a phone, where the actions stack and the lamp hangs further away, and on a desktop.
  let exposureRef = 1

  function layout() {
    const box = host.getBoundingClientRect()
    const rect = canvas.getBoundingClientRect()
    if (!rect.width || !rect.height) return false
    const resized = rect.width !== width || rect.height !== height
    width = rect.width
    height = rect.height
    offset.x = rect.left - box.left
    offset.y = rect.top - box.top
    density = backingDensity(width, height, devicePixelRatio)
    const pixelWidth = Math.max(1, Math.round(width * density))
    const pixelHeight = Math.max(1, Math.round(height * density))
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth
      canvas.height = pixelHeight
    }
    lit = Array.from(host.querySelectorAll<HTMLElement>(litSelector), (element) => {
      // An island wrapper has no box of its own: measure what it holds, and write the lamp on the wrapper,
      // where it inherits into the control without touching the island's own nodes.
      const shape = getComputedStyle(element).display === 'contents' ? element.firstElementChild ?? element : element
      const control = shape.getBoundingClientRect()
      return { element, left: control.left - box.left, top: control.top - box.top, width: control.width, height: control.height, values: [] }
    })
    // The cut-stone title takes the same lamp, so its sheen and shadow agree with Get started's.
    const title = host.querySelector<HTMLElement>(titleSelector)
    if (title) {
      const text = title.getBoundingClientRect()
      lit.push({ element: title, left: text.left - box.left, top: text.top - box.top, width: text.width, height: text.height, values: [], text: true })
    }
    const row = actions?.getBoundingClientRect()
    const rowLeft = row ? row.left - box.left : box.width * 0.3
    const rowTop = row ? row.top - box.top : offset.y
    const rowWidth = row?.width ?? box.width * 0.4
    const rowHeight = Math.min(row?.height ?? 52, 64)
    // The lamp rests above the actions' left third, so light falls across the row and on into the field.
    rest.x = rowLeft + rowWidth * 0.3
    rest.y = rowTop - rowHeight * 2.4
    rest.z = Math.max(260, Math.min(460, box.width * 0.3))
    // Carried, the lamp comes low enough to pick out single threads.
    lowZ = Math.max(150, Math.min(240, box.width * 0.16))
    const middleX = offset.x + rect.width / 2 - rest.x
    const middleY = offset.y + rect.height * 0.5 - rest.y
    exposureRef = rest.z / Math.pow(Math.hypot(middleX, middleY, rest.z), 3)
    const style = getComputedStyle(canvas)
    palette = { gold: style.color, stone: style.borderTopColor, glint: style.outlineColor, dark: style.columnRuleColor === 'rgb(255, 255, 255)' }
    if (resized || !threads.length) build()
    if (aim.source === 'focus') aimAtFocus(document.activeElement)
    return true
  }

  function build() {
    const count = width < 640 ? 36 : 56
    const spread = width * 0.7
    // How far the bell's middle comes toward the viewer at the hem; it tilts the threads into the light.
    const relief = Math.min(spread, height * 2.2) * 0.32
    threads = Array.from({ length: count + 1 }, (_, index) => {
      const lane = index / count * 2 - 1
      const near = Math.sqrt(1 - lane * lane)
      const restPoints = new Float32Array(stride)
      for (let step = 0; step <= segments; step++) {
        const t = step / segments
        const open = Math.pow(t, 1.45)
        restPoints[step * 3] = width / 2 + lane * spread * open
        restPoints[step * 3 + 1] = height * (rootAt + 0.98 * t - 0.32 * Math.pow(Math.abs(lane), 1.6) * t * t)
          + Math.sin(lane * Math.PI) * Math.sin(t * Math.PI) * height * 0.035
        restPoints[step * 3 + 2] = relief * open * near
      }
      const accent = index === count / 2 || index % 7 === 0
      return { lane, near, gold: index === count / 2 || index % 3 !== 0, weight: 0.6 + (accent ? 0.25 : 0), rest: restPoints }
    })
    crowd = Float32Array.from({ length: segments }, (_, step) => {
      const gap = 2 * spread * Math.pow((step + 0.5) / segments, 1.45) / count
      return Math.min(1, gap / 6)
    })
    points = new Float32Array(threads.length * stride)
    waves = new Float32Array(threads.length * (segments + 1))
    levels = new Uint8Array(threads.length * segments)
  }

  /** Where each thread is this frame: opening, lifted toward the lamp it carries, and swung by a wave. */
  function place(now: number, opening: number) {
    const center = width / 2
    const lampX = lamp.x - offset.x, lampY = lamp.y - offset.y
    const radius = Math.min(width * 0.3, 190)
    const travel = Math.min(width, 700)
    const lift = carry.value
    for (let index = 0; index < threads.length; index++) {
      const restPoints = threads[index].rest
      const base = index * stride
      for (let step = 0; step <= segments; step++) {
        let x = center + (restPoints[step * 3] - center) * opening
        let y = restPoints[step * 3 + 1]
        let z = restPoints[step * 3 + 2]
        // The root stays still; the field responds more freely as it opens away from that point.
        const freedom = Math.min(1, Math.max(0, (y / height - rootAt) / 0.18))
        if (lift > 0.001) {
          const dx = x - lampX, dy = y - lampY
          const influence = Math.exp(-(dx * dx + dy * dy) / (radius * radius)) * lift * freedom
          y -= influence * 14
          x += influence * dx * 0.06
          z += influence * 12
        }
        let swell = 0
        for (const ripple of ripples) {
          const age = Math.max(0, (now - ripple.started) / rippleDuration)
          const crest = Math.hypot(x - ripple.x, y - ripple.y) - age * travel
          swell += Math.exp(-(crest * crest) / 1600) * Math.pow(1 - age, 2)
        }
        if (swell) {
          y -= swell * 16 * freedom
          z += swell * 34 * freedom
        }
        points[base + step * 3] = x
        points[base + step * 3 + 1] = y
        points[base + step * 3 + 2] = z
        waves[index * (segments + 1) + step] = Math.min(1, swell) * freedom
      }
    }
  }

  function reachOf(index: number, progress: number) {
    return Math.min(1, Math.max(0, progress * 1.3 - Math.abs(threads[index].lane) * 0.3))
  }

  function trace(index: number, from: number, to: number, tail = -1) {
    const base = index * stride
    context.moveTo(points[base + from * 3], points[base + from * 3 + 1])
    for (let step = from + 1; step <= to; step++) context.lineTo(points[base + step * 3], points[base + step * 3 + 1])
    // A growing thread ends between two of its points, so it lengthens smoothly.
    if (tail > 0 && to < segments) {
      const a = base + to * 3, b = a + 3
      context.lineTo(points[a] + (points[b] - points[a]) * tail, points[a + 1] + (points[b + 1] - points[a + 1]) * tail)
    }
  }

  function draw(now: number) {
    const progress = motion.matches ? 1 : reveal
    place(now, 0.68 + 0.32 * progress)
    context.setTransform(density, 0, 0, density, 0, 0)
    context.clearRect(0, 0, width, height)
    if (progress <= 0) return
    // Once threads leave the bead, the CSS stand-in line below it hands over to them.
    if (!ready) {
      canvas.setAttribute('data-ready', '')
      ready = true
    }
    context.lineCap = 'round'
    context.lineJoin = 'round'
    // A line is never thinner than one device pixel; at 1× its ink is kept by lowering its alpha instead.
    const hairline = 1 / density
    const dark = palette.dark

    // A few transverse curves reveal the ordered surface, without turning it into a diagram.
    context.strokeStyle = palette.gold
    context.lineWidth = Math.max(0.6, hairline)
    for (let row = 1; row < rows; row++) {
      const step = Math.round(Math.pow(row / rows, 0.75) * segments)
      if (step / segments > progress) continue
      context.beginPath()
      let connected = false
      for (let index = 0; index < threads.length; index++) {
        if (step / segments > reachOf(index, progress)) continue
        const at = index * stride + step * 3
        if (connected) context.lineTo(points[at], points[at + 1])
        else context.moveTo(points[at], points[at + 1])
        connected = true
      }
      context.globalAlpha = (dark ? 0.11 : 0.13) * Math.min(1, (progress - step / segments) * 8) * Math.min(1, 0.6 / context.lineWidth)
      context.stroke()
    }

    // The threads: near ones (the bell's middle) a little stronger than those turning away at its sides.
    for (let index = 0; index < threads.length; index++) {
      const thread = threads[index]
      const reach = reachOf(index, progress)
      if (reach <= 0) continue
      const span = reach * segments
      const full = Math.floor(span)
      context.beginPath()
      trace(index, 0, full, span - full)
      const lineWidth = Math.max(thread.weight, hairline)
      const depth = 0.7 + 0.3 * thread.near
      context.lineWidth = lineWidth
      context.strokeStyle = thread.gold ? palette.gold : palette.stone
      context.globalAlpha = (thread.gold ? (dark ? 0.3 : 0.34) : (dark ? 0.16 : 0.13)) * depth * Math.min(1, thread.weight / lineWidth)
      context.stroke()
    }

    glints(progress)
    context.globalAlpha = 1
    context.globalCompositeOperation = 'source-over'
  }

  /**
   * Each thread is a fine fiber: its sheen is brightest where it lies across the half-way direction
   * between the lamp and the viewer (the hair and silk model), and dims with distance from the lamp.
   * On a fan of threads from one point that sheen forms an arc that follows the lamp.
   */
  function glints(progress: number) {
    const dark = palette.dark
    const lampX = lamp.x - offset.x, lampY = lamp.y - offset.y, lampZ = lamp.z
    // Silk is glossier than the stone threads; a carried lamp tightens the sheen as it comes closer.
    const shine = 100 + 60 * carry.value
    // The resting lamp lays a quiet sheen; carried close, it brings the full light.
    const power = 0.5 + 0.5 * carry.value
    // On the light ground a sheen reads as richer gold, which needs more of it to show than light on dark.
    const exposure = dark ? 1 : 1.5
    const arriving = progress < 1 ? Math.sin(Math.PI * Math.min(1, progress * 1.15)) : 0
    levels.fill(0)
    for (let index = 0; index < threads.length; index++) {
      const thread = threads[index]
      const reach = reachOf(index, progress)
      const drawn = Math.floor(reach * segments)
      const base = index * stride
      const gain = (thread.gold ? 1 : 0.4) * (0.55 + 0.45 * thread.near)
      // While a thread grows, its leading end carries a little of the lamp's light down with it.
      const tip = thread.gold && reach < 1 ? arriving * Math.sin(Math.PI * reach) : 0
      for (let step = 0; step < drawn; step++) {
        const a = base + step * 3, b = a + 3
        let tx = points[b] - points[a], ty = points[b + 1] - points[a + 1], tz = points[b + 2] - points[a + 2]
        const length = Math.hypot(tx, ty, tz) || 1
        tx /= length
        ty /= length
        tz /= length
        const lx = lampX - (points[a] + points[b]) / 2
        const ly = lampY - (points[a + 1] + points[b + 1]) / 2
        const lz = lampZ - (points[a + 2] + points[b + 2]) / 2
        const distance = Math.hypot(lx, ly, lz) || 1
        const hx = lx / distance, hy = ly / distance, hz = lz / distance + 1
        const along = (tx * hx + ty * hy + tz * hz) / (Math.hypot(hx, hy, hz) || 1)
        const sheen = Math.pow(Math.max(0, 1 - along * along), shine / 2)
        // A point lamp: light falls off with the square of its distance and with the angle it arrives at.
        // Resting, it is far and lights the whole field evenly; carried close, the eye adjusts to it, so
        // what lies under it is brightest and the light falls away within a lamp's height or two.
        const cosine = Math.max(0, lz) / distance
        const far = Math.min(1.4, cosine / (distance * distance) / exposureRef)
        const falloff = far + (1.4 * cosine * cosine * cosine - far) * carry.value
        const wave = (waves[index * (segments + 1) + step] + waves[index * (segments + 1) + step + 1]) / 2
        // A carried lamp also warms the threads under it a little, whichever way they run.
        const across = (tx * lx + ty * ly + tz * lz) / distance
        const warmth = Math.sqrt(Math.max(0, 1 - across * across)) * falloff * 0.3 * carry.value
        let light = (sheen * falloff * power + warmth + wave * 0.45) * gain * crowd[step]
        if (tip) {
          const behind = (drawn - step) / 2.5
          light += tip * Math.exp(-behind * behind) * 0.75
        }
        levels[index * segments + step] = Math.min(glintLevels, Math.round(light * exposure * glintLevels))
      }
    }
    const hairline = 1 / density
    context.strokeStyle = palette.glint
    context.globalCompositeOperation = dark ? 'lighter' : 'source-over'
    for (let level = 1; level <= glintLevels; level++) {
      context.beginPath()
      let any = false
      for (let index = 0; index < threads.length; index++) {
        const row = index * segments
        let step = 0
        while (step < segments) {
          if (levels[row + step] !== level) {
            step++
            continue
          }
          const from = step
          while (step < segments && levels[row + step] === level) step++
          trace(index, from, step)
          any = true
        }
      }
      if (!any) continue
      const strength = level / glintLevels
      // The sheen widens a hair where it is brightest, and in the dark it blooms softly into the ground.
      context.lineCap = 'butt'
      if (strength > 0.35) {
        context.lineWidth = 2.6
        context.globalAlpha = strength * (dark ? 0.1 : 0.07)
        context.stroke()
      }
      context.lineWidth = Math.max(0.7 + 0.4 * strength, hairline)
      context.globalAlpha = strength * (dark ? 0.85 : 0.95)
      context.stroke()
    }
    context.lineCap = 'round'
  }

  function canDraw() {
    return !disposed && visible && !document.hidden && !contrast.matches && !print.matches
  }

  function schedule() {
    if (!frame && canDraw()) frame = requestAnimationFrame(tick)
  }

  function invalidate() {
    dirty = true
    schedule()
  }

  function tick(time: number) {
    frame = 0
    if (!canDraw()) return
    if (dirty) {
      if (!layout()) return
      dirty = false
    }
    const reduced = motion.matches
    if (started < 0 && (inView || reduced)) started = time
    const delta = previous < 0 ? 16 : Math.min(64, time - previous)
    previous = time
    const opened = reduced ? 1 : started < 0 ? 0 : Math.min(1, (time - started) / revealDuration)
    // A completed still frame never rewinds when the reader turns motion back on.
    reveal = Math.max(reveal, reduced ? 1 : 1 - Math.pow(1 - opened, 3))
    let targetX = rest.x
    let targetY = rest.y
    // The lamp lowers into place as the field opens, so shadows grow from short and faint to their resting length.
    let targetZ = rest.z * (1 + (1 - reveal) * 2.5)
    if (!reduced && aim.source === 'pointer') {
      const box = host.getBoundingClientRect()
      targetX = aim.clientX - box.left
      targetY = aim.clientY - box.top
      targetZ = lowZ
    } else if (!reduced && aim.source === 'focus') {
      targetX = aim.focusX
      targetY = aim.focusY
      targetZ = lowZ * 1.3
    }
    carry.target = !reduced && aim.source !== 'rest' ? (aim.source === 'pointer' ? 1 : 0.6) : 0
    // The same 120ms time constant as the hero's lamp and the page lamp, at any refresh rate.
    const follow = lamp.placed && !reduced ? 1 - Math.exp(-delta / 120) : 1
    lamp.x += (targetX - lamp.x) * follow
    lamp.y += (targetY - lamp.y) * follow
    lamp.z += (targetZ - lamp.z) * follow
    lamp.placed = true
    carry.value += (carry.target - carry.value) * (reduced ? 1 : 1 - Math.exp(-delta / 220))
    ripples = reduced ? [] : ripples.filter((ripple) => time - ripple.started < rippleDuration)
    illuminate()
    draw(time)
    // Before the canvas is in view the bead holds still, and the field sleeps until it is.
    const settled = (reveal >= 1 || started < 0) && !ripples.length
      && Math.abs(lamp.x - targetX) < 0.25 && Math.abs(lamp.y - targetY) < 0.25 && Math.abs(lamp.z - targetZ) < 0.25
      && Math.abs(carry.value - carry.target) < 0.002
    if (!settled && !reduced) schedule()
    else previous = -1
  }

  function illuminate() {
    const near = aim.source === 'rest' ? 0.4 : 1
    for (const control of lit) {
      const values = control.text ? litValues(control, lamp, near, { elevation: 3, text: true }) : litValues(control, lamp, near)
      values.forEach((value, index) => {
        if (value !== control.values[index]) control.element.style.setProperty(ctaLitProperties[index], value)
      })
      control.values = values
    }
    // The lamp's light pools softly on the ground around the invitation.
    const pool = [`${Math.round(lamp.x / 2) * 2}px`, `${Math.round(lamp.y / 2) * 2}px`]
    if (pool[0] !== poolValues[0]) host.style.setProperty('--cta-lamp-x', pool[0])
    if (pool[1] !== poolValues[1]) host.style.setProperty('--cta-lamp-y', pool[1])
    poolValues = pool
  }

  function unlight() {
    for (const control of lit) {
      ctaLitProperties.forEach((name) => control.element.style.removeProperty(name))
      control.values = []
    }
    host.style.removeProperty('--cta-lamp-x')
    host.style.removeProperty('--cta-lamp-y')
    poolValues = ['', '']
  }

  function activity() {
    cancelAnimationFrame(frame)
    frame = 0
    previous = -1
    if (contrast.matches || print.matches) unlight()
    if (motion.matches) {
      aim.source = 'rest'
      ripples = []
    }
    dirty = true
    schedule()
  }

  function move(event: PointerEvent) {
    if (motion.matches || event.pointerType !== 'mouse') return
    aim.clientX = event.clientX
    aim.clientY = event.clientY
    if (aim.source !== 'pointer') addEventListener('scroll', scroll, { passive: true })
    aim.source = 'pointer'
    schedule()
  }

  function leave() {
    if (aim.source !== 'pointer') return
    removeEventListener('scroll', scroll)
    aim.source = 'rest'
    if (!aimAtFocus(document.activeElement)) schedule()
  }

  // Scrolling under a resting mouse moves the lamp across the field, so it is followed only then.
  function scroll() {
    schedule()
  }

  function press(event: MouseEvent) {
    // Controls, the command and a finished text selection are not taps on the field, and a field that has
    // not opened yet has nothing to carry a wave.
    if (motion.matches || !ready || (event.target as Element).closest('a,button,code') || getSelection()?.toString()) return
    const box = canvas.getBoundingClientRect()
    ripples.push({ x: event.clientX - box.left, y: event.clientY - box.top, started: performance.now() })
    ripples = ripples.slice(-3)
    schedule()
  }

  // Keyboard focus hangs the lamp just above the focused control.
  function aimAtFocus(target: Element | null) {
    const control = target instanceof Element ? lit.find((item) => item.element.contains(target)) : undefined
    if (motion.matches || !control || !target?.matches(':focus-visible')) return false
    aim.focusX = control.left + control.width * 0.35
    aim.focusY = control.top - control.height * 0.6
    if (aim.source !== 'pointer') aim.source = 'focus'
    schedule()
    return true
  }

  function focus(event: FocusEvent) {
    aimAtFocus(event.target as Element)
  }

  function blur(event: FocusEvent) {
    if (aim.source === 'focus' && !host.contains(event.relatedTarget as Node)) {
      aim.source = 'rest'
      schedule()
    }
  }

  const resize = new ResizeObserver(invalidate)
  resize.observe(canvas)
  resize.observe(host)
  const theme = new MutationObserver(invalidate)
  theme.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style', 'data-theme'] })
  // Notifications batch while layout settles; the last entry is the current state.
  const intersection = new IntersectionObserver((entries) => {
    const entry = entries[entries.length - 1]
    visible = entry.isIntersecting
    activity()
  })
  intersection.observe(host)
  const arrival = new IntersectionObserver((entries) => {
    const entry = entries[entries.length - 1]
    if (!entry.isIntersecting || entry.intersectionRatio < revealThreshold) return
    inView = true
    arrival.disconnect()
    schedule()
  }, { threshold: [0, revealThreshold] })
  arrival.observe(canvas)
  motion.addEventListener('change', activity)
  contrast.addEventListener('change', activity)
  print.addEventListener('change', activity)
  scheme.addEventListener('change', invalidate)
  document.addEventListener('visibilitychange', activity)
  host.addEventListener('pointermove', move, { passive: true })
  host.addEventListener('pointerleave', leave)
  // A native click tells a tap from a touch scroll, so the page never intercepts a gesture.
  host.addEventListener('click', press, { passive: true })
  host.addEventListener('focusin', focus)
  host.addEventListener('focusout', blur)
  // A 2D canvas can lose its backing store under memory pressure; it comes back blank, so redraw it.
  canvas.addEventListener('contextrestored', invalidate)
  addEventListener('resize', invalidate)

  return () => {
    disposed = true
    cancelAnimationFrame(frame)
    unlight()
    canvas.removeAttribute('data-ready')
    resize.disconnect()
    theme.disconnect()
    intersection.disconnect()
    arrival.disconnect()
    motion.removeEventListener('change', activity)
    contrast.removeEventListener('change', activity)
    print.removeEventListener('change', activity)
    scheme.removeEventListener('change', invalidate)
    document.removeEventListener('visibilitychange', activity)
    host.removeEventListener('pointermove', move)
    host.removeEventListener('pointerleave', leave)
    host.removeEventListener('click', press)
    host.removeEventListener('focusin', focus)
    host.removeEventListener('focusout', blur)
    canvas.removeEventListener('contextrestored', invalidate)
    removeEventListener('scroll', scroll)
    removeEventListener('resize', invalidate)
  }
}
