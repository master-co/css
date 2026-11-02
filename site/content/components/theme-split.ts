import { surfaceModeValues } from './design-system-content'

const sweep = [[0, 50], [1100, 22], [2500, 78], [3400, 50]] as const
const clamp = (value: number) => Math.min(100, Math.max(0, value))

function sweepAt(time: number) {
  const index = sweep.findIndex(([at]) => at >= time)
  if (index <= 0) return index === 0 ? sweep[0][1] : 50
  const [start, from] = sweep[index - 1], [end, to] = sweep[index]
  return from + (to - from) * (1 - Math.cos((time - start) / (end - start) * Math.PI)) / 2
}

/** Move the split and its measurements together, without rendering either copy of the interface again. */
export function mountThemeSplit(root: HTMLElement, artboard: HTMLElement, describe: (light: number, dark: number) => string) {
  const slider = root.querySelector<HTMLElement>('.home-theme-slider')!
  const [lightLabel, darkLabel] = [...root.querySelectorAll<HTMLElement>('.home-theme-measure-label')]
  const lightCopy = root.querySelector<HTMLElement>('.home-theme-copy-light')!
  const darkCopy = root.querySelector<HTMLElement>('.home-theme-copy-dark')!
  const divider = root.querySelector<HTMLElement>('.home-theme-divider')!
  const knob = root.querySelector<HTMLElement>('.home-theme-knob')!
  const measure = root.querySelector<HTMLElement>('.home-theme-measure')!
  const lines = [...root.closest('.home-bento-grid')?.querySelectorAll<HTMLElement>('.home-tokens-code .line') ?? []]
  const [lightToken, darkToken] = surfaceModeValues.map(({ value }) => lines.find((line) => line.textContent?.includes(value)))
  const reduced = matchMedia('(prefers-reduced-motion: reduce)')
  let split = 50, rounded = -1, frame = 0, elapsed = 0, previous = 0
  let visible = false, admitted = false, interacted = false, disposed = false, pending: number | undefined
  let gesture: { id: number, x: number, y: number, mouse: boolean, dragging: boolean } | undefined

  function paint(value: number) {
    const next = clamp(value)
    if (rounded >= 0 && Math.abs(next - split) < .001) return
    split = next
    const percent = `${split.toFixed(3)}%`
    // Updating the two clips directly avoids invalidating an inherited variable through both UI trees.
    lightCopy.style.clipPath = `inset(0 ${(100 - split).toFixed(3)}% 0 0)`
    darkCopy.style.clipPath = `inset(0 0 0 ${percent})`
    divider.style.left = knob.style.left = percent
    measure.style.setProperty('--home-split', percent)
    const light = Math.round(split), dark = 100 - light
    if (light !== rounded) {
      slider.setAttribute('aria-valuenow', String(light))
      slider.setAttribute('aria-valuetext', describe(light, dark))
      lightLabel.textContent = light >= 16 ? `${light}%` : ''
      darkLabel.textContent = dark >= 16 ? `${dark}%` : ''
      // The code lines quote the same whole percents as the ruler, so the two always sum to 100.
      lightToken?.style.setProperty('--home-token-percent', String(light))
      darkToken?.style.setProperty('--home-token-percent', String(dark))
      rounded = light
    }
    lightLabel.style.left = `${split / 2}%`
    darkLabel.style.left = `${split + (100 - split) / 2}%`
    lightToken?.style.setProperty('--home-token-share', (split / 100).toFixed(3))
    darkToken?.style.setProperty('--home-token-share', (1 - split / 100).toFixed(3))
  }

  function touring() {
    return admitted && visible && !interacted && !gesture && !reduced.matches && elapsed < sweep.at(-1)![0]
  }

  function request() {
    if (!disposed && !frame && !document.hidden && (pending !== undefined || touring())) frame = requestAnimationFrame(tick)
  }

  function tick(now: number) {
    frame = 0
    if (pending !== undefined) {
      paint(pending)
      pending = undefined
    } else if (touring()) {
      elapsed += previous ? Math.min(50, now - previous) : 0
      previous = now
      paint(sweepAt(elapsed))
    }
    request()
  }

  function pause() {
    cancelAnimationFrame(frame)
    frame = 0
    previous = 0
  }

  function stopTour() {
    interacted = true
    pause()
  }

  function update(clientX: number) {
    const rect = artboard.getBoundingClientRect()
    pending = clamp((clientX - rect.left) / rect.width * 100)
    request()
  }

  function down(event: PointerEvent) {
    if (!event.isPrimary || event.button !== 0) return
    pause()
    const mouse = event.pointerType === 'mouse'
    gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, mouse, dragging: mouse }
    if (mouse) {
      interacted = true
      root.dataset.dragging = ''
      slider.setPointerCapture(event.pointerId)
      update(event.clientX)
    }
  }

  function move(event: PointerEvent) {
    if (!gesture || gesture.id !== event.pointerId) return
    const dx = Math.abs(event.clientX - gesture.x), dy = Math.abs(event.clientY - gesture.y)
    if (!gesture.dragging && dx > 8 && dx > dy * 1.3) {
      gesture.dragging = true
      interacted = true
      root.dataset.dragging = ''
      slider.setPointerCapture(event.pointerId)
    }
    if (gesture.dragging) update(event.clientX)
  }

  function finish() {
    const id = gesture?.id
    gesture = undefined
    delete root.dataset.dragging
    if (id !== undefined && slider.hasPointerCapture(id)) slider.releasePointerCapture(id)
    previous = 0
    request()
  }

  function up(event: PointerEvent) {
    if (gesture?.id !== event.pointerId) return
    if (gesture.dragging || Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) < 8) {
      interacted = true
      update(event.clientX)
    }
    finish()
  }

  function key(event: KeyboardEvent) {
    const step = event.shiftKey ? 1 : 5
    const next = { ArrowLeft: split - step, ArrowDown: split - step, ArrowRight: split + step, ArrowUp: split + step, PageDown: split - 20, PageUp: split + 20, Home: 0, End: 100 }[event.key]
    if (next === undefined) return
    event.preventDefault()
    stopTour()
    pending = undefined
    paint(Math.round(next))
  }

  function visibility() {
    if (document.hidden) { pause(); pending = undefined }
    else request()
  }

  function motion() {
    if (reduced.matches) {
      pause()
      if (!interacted) { elapsed = sweep.at(-1)![0]; paint(50) }
    } else request()
  }

  // Notifications batch while layout settles; the last entry is the current state.
  const intersection = new IntersectionObserver((entries) => {
    const entry = entries[entries.length - 1]
    visible = entry.isIntersecting
    admitted ||= entry.intersectionRatio >= .55
    if (!visible) { pause(); pending = undefined }
    else request()
  }, { threshold: [0, .55] })
  intersection.observe(root)
  reduced.addEventListener('change', motion)
  document.addEventListener('visibilitychange', visibility)
  const listeners = { pointerdown: down, pointermove: move, pointerup: up, pointercancel: finish, lostpointercapture: finish, keydown: key, focus: stopTour }
  for (const [name, listener] of Object.entries(listeners)) slider.addEventListener(name, listener as EventListener)
  paint(50)
  return () => {
    disposed = true
    pause()
    intersection.disconnect()
    reduced.removeEventListener('change', motion)
    document.removeEventListener('visibilitychange', visibility)
    for (const [name, listener] of Object.entries(listeners)) slider.removeEventListener(name, listener as EventListener)
    finish()
  }
}
