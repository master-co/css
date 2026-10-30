import { backingDensity, ctaLitProperties, litValues, type Box, type Lamp } from './cta-light'
import { ctaRippleCount, ctaSilkSource, ctaVertexSource } from './cta-shaders'

const revealDuration = 2000
// The sheet waits on its bead until this much of the canvas is in view, so the reader sees it unfurl.
const revealThreshold = 0.38
const rippleDuration = 1700
const litSelector = '.home-cta-actions > *'
const titleSelector = '.home-cta-title-finish'
const uniformNames = ['resolution', 'density', 'origin', 'extent', 'lanes', 'reveal', 'lamp', 'carried', 'ripples', 'rippling', 'shadow', 'body', 'sheen', 'dark'] as const

interface LitControl extends Box { element: HTMLElement, values: string[], text?: boolean }
interface Ripple { x: number, y: number, started: number }

/**
 * The closing silk and its lamp. The lamp lives in the invitation's coordinates and lights both the
 * WebGL drape below the actions and the native controls above it, through the same `--lit-*` and
 * `--cast-*` properties the hero uses. It draws only while something changes, then sleeps.
 */
export function mountCTAField(host: HTMLElement, canvas: HTMLCanvasElement, onRestore?: () => void, settled = false) {
  let gl: WebGLRenderingContext | null = null
  try {
    gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false })
  } catch {
    // The invitation, its controls and the CSS starting point remain complete without WebGL.
  }
  const probe = document.createElement('canvas').getContext('2d', { willReadFrequently: true })
  if (!gl || !probe) return
  const context = gl
  const actions = host.querySelector<HTMLElement>('.home-cta-actions')
  const page = host.closest<HTMLElement>('.home-page') ?? document.body
  const motion = matchMedia('(prefers-reduced-motion: reduce)')
  const contrast = matchMedia('(forced-colors: active)')
  const print = matchMedia('print')
  const scheme = matchMedia('(prefers-color-scheme: dark)')

  let disposed = false, failed = false, lost = false, visible = false, dirty = true, inView = settled
  const shaders: WebGLShader[] = []
  let program: WebGLProgram | null = null
  let buffer: WebGLBuffer | null = null
  let uniforms = {} as Record<typeof uniformNames[number], WebGLUniformLocation | null>
  try {
    program = context.createProgram()
    if (!program) throw new Error('Cannot allocate the closing silk')
    for (const [type, source] of [[context.VERTEX_SHADER, ctaVertexSource], [context.FRAGMENT_SHADER, ctaSilkSource]] as const) {
      const shader = context.createShader(type)
      if (!shader) throw new Error('Cannot allocate a silk shader')
      shaders.push(shader)
      context.shaderSource(shader, source)
      context.compileShader(shader)
      if (!context.getShaderParameter(shader, context.COMPILE_STATUS)) throw new Error(context.getShaderInfoLog(shader) ?? 'Cannot compile the closing silk')
      context.attachShader(program, shader)
    }
    context.bindAttribLocation(program, 0, 'position')
    context.linkProgram(program)
    if (!context.getProgramParameter(program, context.LINK_STATUS)) throw new Error('Cannot link the closing silk')
    context.useProgram(program)
    const linked = program
    uniforms = Object.fromEntries(uniformNames.map((name) => [name, context.getUniformLocation(linked, name === 'ripples' ? 'ripples[0]' : name)])) as typeof uniforms
    buffer = context.createBuffer()
    if (!buffer) throw new Error('Cannot allocate the silk triangle')
    context.bindBuffer(context.ARRAY_BUFFER, buffer)
    context.bufferData(context.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), context.STATIC_DRAW)
    context.enableVertexAttribArray(0)
    context.vertexAttribPointer(0, 2, context.FLOAT, false, 0, 0)
  } catch {
    release()
    return
  }

  // A field rebuilt after a lost context opens complete instead of unfurling a second time.
  let frame = 0, previous = -1, started = -1, reveal = settled ? 1 : 0
  let width = 0, height = 0, density = 1
  // The canvas sits inside the invitation; the lamp and controls use the invitation's coordinates.
  const offset = { x: 0, y: 0 }
  const rest: Lamp = { x: 0, y: 0, z: 1 }
  const lamp: Lamp & { placed: boolean } = { x: 0, y: 0, z: 1, placed: false }
  const aim = { source: 'rest' as 'rest' | 'pointer' | 'focus', clientX: 0, clientY: 0, focusX: 0, focusY: 0 }
  const carry = { value: 0, target: 0 }
  let lowZ = 160
  let ripples: Ripple[] = []
  let lit: LitControl[] = []
  let poolValues = ['', '']
  const rippleData = new Float32Array(ctaRippleCount * 4)

  function channels(color: string) {
    probe!.clearRect(0, 0, 1, 1)
    probe!.fillStyle = '#000'
    probe!.fillStyle = color
    probe!.fillRect(0, 0, 1, 1)
    const [red, green, blue] = probe!.getImageData(0, 0, 1, 1).data
    return [red / 255, green / 255, blue / 255] as const
  }

  function layout() {
    const box = host.getBoundingClientRect()
    const rect = canvas.getBoundingClientRect()
    if (!rect.width || !rect.height) return false
    width = rect.width
    height = rect.height
    offset.x = rect.left - box.left
    offset.y = rect.top - box.top
    density = backingDensity(width, height, devicePixelRatio)
    const pixelWidth = Math.max(1, Math.floor(width * density))
    const pixelHeight = Math.max(1, Math.floor(height * density))
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
    // The lamp rests above the actions' left third, so light falls across the row and on into the silk.
    rest.x = rowLeft + rowWidth * 0.3
    rest.y = rowTop - rowHeight * 2.4
    rest.z = Math.max(260, Math.min(460, box.width * 0.3))
    // Carried, the lamp comes low enough to rake the folds but stays high enough to keep the bell's sheen.
    lowZ = Math.max(160, Math.min(270, box.width * 0.18))
    const originY = Math.min(36, height * 0.1)
    // The drape keeps a bell's proportions at every width rather than flattening into a fan.
    const spread = Math.min(width * 0.58, (height - originY) * 1.9)
    const style = getComputedStyle(canvas)
    const ground = channels(getComputedStyle(page).backgroundColor)
    const groundLight = ground[0] * 0.2126 + ground[1] * 0.7152 + ground[2] * 0.0722
    context.viewport(0, 0, canvas.width, canvas.height)
    context.uniform2f(uniforms.resolution, width, height)
    context.uniform1f(uniforms.density, canvas.width / width)
    context.uniform2f(uniforms.origin, width / 2, originY)
    context.uniform2f(uniforms.extent, spread, height - originY)
    // About one thread every 11px at the hem; fewer, wider-spaced threads on phones.
    context.uniform1f(uniforms.lanes, Math.round(Math.max(56, Math.min(200, spread * 2 / (width < 640 ? 9 : 11))) / 2) * 2)
    context.uniform3f(uniforms.shadow, ...channels(style.color))
    context.uniform3f(uniforms.body, ...channels(style.caretColor))
    context.uniform3f(uniforms.sheen, ...channels(style.outlineColor))
    context.uniform1f(uniforms.dark, groundLight < 0.4 ? 1 : 0)
    if (aim.source === 'focus') aimAtFocus(document.activeElement)
    return true
  }

  function canDraw() {
    return !disposed && !failed && !lost && visible && !document.hidden && !contrast.matches && !print.matches
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
    try {
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
      // The lamp lowers into place as the silk unfurls, so shadows grow from short and faint to their resting length.
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
      const follow = lamp.placed && !reduced ? 1 - Math.exp(-delta / 120) : 1
      lamp.x += (targetX - lamp.x) * follow
      lamp.y += (targetY - lamp.y) * follow
      lamp.z += (targetZ - lamp.z) * follow
      lamp.placed = true
      carry.value += (carry.target - carry.value) * (reduced ? 1 : 1 - Math.exp(-delta / 220))
      ripples = reduced ? [] : ripples.filter((ripple) => time - ripple.started < rippleDuration)
      rippleData.fill(0)
      ripples.slice(-ctaRippleCount).forEach((ripple, index) => {
        rippleData.set([ripple.x, ripple.y, (time - ripple.started) / rippleDuration, 1], index * 4)
      })
      illuminate()
      context.uniform1f(uniforms.reveal, reveal)
      context.uniform3f(uniforms.lamp, lamp.x - offset.x, lamp.y - offset.y, lamp.z)
      context.uniform1f(uniforms.carried, carry.value)
      context.uniform4fv(uniforms.ripples, rippleData)
      context.uniform1f(uniforms.rippling, ripples.length ? 1 : 0)
      context.clearColor(0, 0, 0, 0)
      context.clear(context.COLOR_BUFFER_BIT)
      context.drawArrays(context.TRIANGLES, 0, 3)
      if (!canvas.hasAttribute('data-ready')) {
        if (context.getError() !== context.NO_ERROR) throw new Error('Cannot draw the closing silk')
        canvas.setAttribute('data-ready', '')
      }
      // Before the canvas is in view the bead holds still, and the field sleeps until it is.
      const settled = (reveal >= 1 || started < 0) && !ripples.length
        && Math.abs(lamp.x - targetX) < 0.25 && Math.abs(lamp.y - targetY) < 0.25 && Math.abs(lamp.z - targetZ) < 0.25
        && Math.abs(carry.value - carry.target) < 0.002
      if (!settled && !reduced) schedule()
      else previous = -1
    } catch {
      if (!disposed) fallback()
    }
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

  function release() {
    if (lost) return
    if (program) context.deleteProgram(program)
    shaders.forEach((shader) => context.deleteShader(shader))
    if (buffer) context.deleteBuffer(buffer)
    program = null
    buffer = null
  }

  function fallback() {
    failed = true
    cancelAnimationFrame(frame)
    frame = 0
    unlight()
    canvas.removeAttribute('data-ready')
    canvas.hidden = true
    release()
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
    aim.source = 'pointer'
    schedule()
  }

  function leave() {
    if (aim.source !== 'pointer') return
    aim.source = 'rest'
    if (!aimAtFocus(document.activeElement)) schedule()
  }

  function scroll() {
    if (aim.source === 'pointer') schedule()
  }

  function press(event: MouseEvent) {
    // Controls, the command and a finished text selection are not taps on the silk.
    if (motion.matches || (event.target as Element).closest('a,button,code') || getSelection()?.toString()) return
    const box = canvas.getBoundingClientRect()
    ripples.push({ x: event.clientX - box.left, y: event.clientY - box.top, started: performance.now() })
    ripples = ripples.slice(-ctaRippleCount)
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

  function contextLost(event: Event) {
    event.preventDefault()
    lost = true
    cancelAnimationFrame(frame)
    frame = 0
    unlight()
    canvas.removeAttribute('data-ready')
  }

  function contextRestored() {
    onRestore?.()
  }

  const resize = new ResizeObserver(invalidate)
  resize.observe(canvas)
  resize.observe(host)
  const theme = new MutationObserver(invalidate)
  theme.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style', 'data-theme'] })
  const intersection = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting
    activity()
  })
  intersection.observe(host)
  const arrival = new IntersectionObserver(([entry]) => {
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
  canvas.addEventListener('webglcontextlost', contextLost)
  canvas.addEventListener('webglcontextrestored', contextRestored)
  addEventListener('scroll', scroll, { passive: true })
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
    canvas.removeEventListener('webglcontextlost', contextLost)
    canvas.removeEventListener('webglcontextrestored', contextRestored)
    removeEventListener('scroll', scroll)
    removeEventListener('resize', invalidate)
    release()
  }
}
