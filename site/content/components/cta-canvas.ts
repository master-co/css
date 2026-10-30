interface Point { x: number, y: number }
interface Thread { points: Point[], weight: number, gold: boolean }
interface Ripple extends Point { started: number }

const pixelBudget = 2_000_000
const revealDuration = 1800
const rippleDuration = 1600

/** A small, transparent 2D field. It sleeps after the arrival and every pointer response. */
export function mountCTAField(host: HTMLElement, canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const context = ctx
  const reduced = matchMedia('(prefers-reduced-motion: reduce)')
  const contrast = matchMedia('(forced-colors: active)')
  const scheme = matchMedia('(prefers-color-scheme: dark)')
  let width = 0, height = 0, density = 1, frame = 0
  let visible = false, disposed = false, dirty = true, ready = false
  let started = 0, reveal = 0, last = 0
  let threads: Thread[] = []
  let ripples: Ripple[] = []
  let focused: HTMLElement | null = null
  let colors = { thread: '', line: '', light: '' }
  const pointer = { x: 0, y: 0, strength: 0 }
  const target = { x: 0, y: 0, strength: 0 }

  function measure() {
    const rect = canvas.getBoundingClientRect()
    const previous = { width, height }
    width = rect.width
    height = rect.height
    if (!width || !height) return
    density = Math.min(devicePixelRatio || 1, 2, Math.sqrt(pixelBudget / (width * height)))
    canvas.width = Math.max(1, Math.floor(width * density))
    canvas.height = Math.max(1, Math.floor(height * density))
    const style = getComputedStyle(canvas)
    colors = { thread: style.color, line: style.borderTopColor, light: style.outlineColor }
    const count = width < 640 ? 36 : 56
    threads = Array.from({ length: count + 1 }, (_, index) => {
      const lane = index / count * 2 - 1
      return {
        weight: 0.6 + (index === count / 2 || index % 7 === 0 ? 0.25 : 0),
        gold: index === count / 2 || index % 3 !== 0,
        points: Array.from({ length: 65 }, (_, step) => {
          const t = step / 64
          return {
            x: width / 2 + lane * width * 0.7 * Math.pow(t, 1.45),
            y: height * (0.09 + 0.98 * t - 0.32 * Math.pow(Math.abs(lane), 1.6) * t * t)
              + Math.sin(lane * Math.PI) * Math.sin(t * Math.PI) * height * 0.035
          }
        })
      }
    })
    if (previous.width && previous.height) {
      pointer.x *= width / previous.width
      target.x *= width / previous.width
      pointer.y *= height / previous.height
      target.y *= height / previous.height
    } else {
      pointer.x = target.x = width / 2
      pointer.y = target.y = height * 0.45
    }
    if (focused) focusTarget(focused, rect)
    dirty = false
  }

  function displace(point: Point, now: number): Point {
    let { x, y } = point
    // The root stays still; the field responds more freely as it opens away from that point.
    const freedom = Math.min(1, Math.max(0, (y / height - 0.09) / 0.18))
    if (pointer.strength > 0.001) {
      const dx = x - pointer.x, dy = y - pointer.y
      const radius = Math.min(width * 0.3, 190)
      const influence = Math.exp(-(dx * dx + dy * dy) / (radius * radius)) * pointer.strength * freedom
      y -= influence * 19
      x += influence * dx * 0.07
    }
    for (const ripple of ripples) {
      const age = Math.max(0, (now - ripple.started) / rippleDuration)
      const distance = Math.hypot(x - ripple.x, y - ripple.y)
      const crest = distance - age * Math.min(width, 700)
      const wave = Math.exp(-(crest * crest) / 1600) * Math.pow(1 - age, 2)
      y -= wave * 16 * freedom
    }
    return { x, y }
  }

  function draw(now: number) {
    if (!width || !height) return
    context.setTransform(density, 0, 0, density, 0, 0)
    context.clearRect(0, 0, width, height)
    context.lineCap = 'round'
    const progress = reduced.matches ? 1 : reveal
    const light = context.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, Math.min(width * 0.3, 190))
    light.addColorStop(0, colors.light)
    light.addColorStop(1, 'transparent')
    for (let index = 0; index < threads.length; index++) {
      const thread = threads[index]
      const lane = Math.abs(index / (threads.length - 1) * 2 - 1)
      const reach = Math.min(1, Math.max(0, progress * 1.3 - lane * 0.3))
      if (reach <= 0) continue
      context.beginPath()
      const steps = Math.min(64, Math.ceil(reach * 64))
      for (let step = 0; step <= steps; step++) {
        const p = displace(thread.points[step], now)
        if (step === 0) context.moveTo(p.x, p.y)
        else context.lineTo(p.x, p.y)
      }
      context.lineWidth = thread.weight
      context.strokeStyle = thread.gold ? colors.thread : colors.line
      context.globalAlpha = thread.gold ? 0.25 : 0.4
      context.stroke()
      if (pointer.strength > 0.001) {
        context.strokeStyle = light
        context.lineWidth = thread.weight + 0.35
        context.globalAlpha = pointer.strength * 0.7
        context.stroke()
      }
    }
    // A few transverse curves reveal the ordered surface, without turning it into a diagram.
    for (let row = 1; row < 12; row++) {
      const step = Math.round(Math.pow(row / 12, 0.75) * 64)
      if (step / 64 > progress) continue
      context.beginPath()
      let connected = false
      for (let index = 0; index < threads.length; index++) {
        const lane = Math.abs(index / (threads.length - 1) * 2 - 1)
        if (step / 64 > progress * 1.3 - lane * 0.3) continue
        const p = displace(threads[index].points[step], now)
        if (!connected) context.moveTo(p.x, p.y)
        else context.lineTo(p.x, p.y)
        connected = true
      }
      context.lineWidth = 0.6
      context.strokeStyle = colors.thread
      context.globalAlpha = 0.11 * Math.min(1, (progress - step / 64) * 8)
      context.stroke()
    }
    context.globalAlpha = 1
    // Fade all sides into the page, keeping an open silhouette rather than a hard canvas rectangle.
    context.globalCompositeOperation = 'destination-in'
    const vertical = context.createLinearGradient(0, 0, 0, height)
    vertical.addColorStop(0, 'transparent')
    vertical.addColorStop(0.09, 'transparent')
    vertical.addColorStop(0.22, 'black')
    vertical.addColorStop(0.6, 'black')
    vertical.addColorStop(1, 'transparent')
    context.fillStyle = vertical
    context.fillRect(0, 0, width, height)
    const horizontal = context.createLinearGradient(0, 0, width, 0)
    horizontal.addColorStop(0, 'transparent')
    horizontal.addColorStop(0.15, 'black')
    horizontal.addColorStop(0.85, 'black')
    horizontal.addColorStop(1, 'transparent')
    context.fillStyle = horizontal
    context.fillRect(0, 0, width, height)
    context.globalCompositeOperation = 'source-over'
    if (progress === 1 && !ready) {
      canvas.dataset.ready = ''
      ready = true
    }
  }

  function canRun() {
    return visible && !document.hidden && !contrast.matches && !disposed
  }

  function schedule() {
    if (!frame && canRun()) frame = requestAnimationFrame(tick)
  }

  function tick(now: number) {
    frame = 0
    if (!canRun()) return
    if (dirty) measure()
    const dt = Math.min(64, last ? now - last : 16)
    last = now
    if (!started) started = now
    const elapsed = Math.min(1, (now - started) / revealDuration)
    // A completed still frame cannot rewind when the reader enables motion.
    reveal = reduced.matches ? 1 : Math.max(reveal, 1 - Math.pow(1 - elapsed, 3))
    const ease = 1 - Math.exp(-dt / 95)
    pointer.x += (target.x - pointer.x) * ease
    pointer.y += (target.y - pointer.y) * ease
    pointer.strength += (target.strength - pointer.strength) * ease
    ripples = reduced.matches ? [] : ripples.filter((ripple) => now - ripple.started < rippleDuration)
    draw(now)
    const unsettled = Math.abs(pointer.strength - target.strength) > 0.001
      || (target.strength > 0 && Math.hypot(pointer.x - target.x, pointer.y - target.y) > 0.1)
    if (!reduced.matches && (reveal < 1 || unsettled || ripples.length)) schedule()
    else last = 0
  }

  function invalidate() {
    dirty = true
    schedule()
  }

  function activity() {
    cancelAnimationFrame(frame)
    frame = 0
    last = 0
    if (reduced.matches) {
      pointer.strength = target.strength = 0
      ripples = []
    } else if (focused) focusTarget(focused)
    schedule()
  }

  function move(event: PointerEvent) {
    if (reduced.matches || event.pointerType === 'touch') return
    const rect = canvas.getBoundingClientRect()
    target.x = event.clientX - rect.left
    target.y = event.clientY - rect.top
    target.strength = 1
    schedule()
  }

  function leave() {
    if (reduced.matches) return
    if (focused) {
      focusTarget(focused)
      schedule()
      return
    }
    if (target.strength === 0 && pointer.strength <= 0.001) return
    target.strength = 0
    schedule()
  }

  function press(event: MouseEvent) {
    if (reduced.matches || (event.target as Element).closest('a,button')) return
    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left, y = event.clientY - rect.top
    if (y < 0 || y > height) return
    ripples.push({ x, y, started: performance.now() })
    ripples = ripples.slice(-3)
    schedule()
  }

  function focusTarget(element: HTMLElement, field = canvas.getBoundingClientRect()) {
    if (reduced.matches) return
    const rect = element.getBoundingClientRect()
    target.x = rect.left + rect.width / 2 - field.left
    target.y = height * 0.22
    target.strength = 0.65
  }

  function focus(event: FocusEvent) {
    if (!(event.target instanceof HTMLElement)) return
    focused = event.target
    focusTarget(focused)
    schedule()
  }

  function blur(event: FocusEvent) {
    if (event.relatedTarget instanceof Node && host.contains(event.relatedTarget)) return
    focused = null
    leave()
  }

  const resize = new ResizeObserver(invalidate)
  resize.observe(canvas)
  const theme = new MutationObserver(invalidate)
  theme.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style', 'data-theme'] })
  const intersection = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting
    activity()
  })
  intersection.observe(canvas)
  reduced.addEventListener('change', activity)
  contrast.addEventListener('change', activity)
  scheme.addEventListener('change', invalidate)
  document.addEventListener('visibilitychange', activity)
  host.addEventListener('pointermove', move, { passive: true })
  host.addEventListener('pointerleave', leave)
  // Native click distinguishes a tap from a touch scroll, with no gesture interception.
  host.addEventListener('click', press, { passive: true })
  host.addEventListener('focusin', focus)
  host.addEventListener('focusout', blur)
  window.addEventListener('resize', invalidate)

  return () => {
    disposed = true
    canvas.removeAttribute('data-ready')
    cancelAnimationFrame(frame)
    resize.disconnect()
    theme.disconnect()
    intersection.disconnect()
    reduced.removeEventListener('change', activity)
    contrast.removeEventListener('change', activity)
    scheme.removeEventListener('change', invalidate)
    document.removeEventListener('visibilitychange', activity)
    host.removeEventListener('pointermove', move)
    host.removeEventListener('pointerleave', leave)
    host.removeEventListener('click', press)
    host.removeEventListener('focusin', focus)
    host.removeEventListener('focusout', blur)
    window.removeEventListener('resize', invalidate)
  }
}
