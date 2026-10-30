/**
 * The page lamp below the hero. One light hangs above the viewport, a little left of center, and stays
 * with the viewer as the page scrolls, so light slides across the stone. A mouse carries it lower over
 * whatever it points at; keyboard focus hangs it above the focused stone, and tilting a phone swings
 * it, as in the hero. Every `.home-lit` element in view receives the lamp relative to itself as
 * `--lit-x`, `--lit-y`, `--lit-angle`, `--cast-x`, `--cast-y` and `--lit-near`, the same properties
 * the hero canvas hands its controls. Islands may hydrate after the lamp first writes, so every lit
 * element opts out of hydration warnings.
 */

export interface Lamp { x: number, y: number, z: number, near: number }
interface Box { left: number, top: number, width: number, height: number }

export const litProperties = ['--lit-x', '--lit-y', '--lit-angle', '--cast-x', '--cast-y', '--lit-near'] as const

const restX = 0.36
const restY = -0.32
const restHeight = 900
const pointerHeight = 260
const nearRadius = 260
// The lamp closes on its target with the same time constant as the hero's and the close's lamps.
const settleMs = 120

export function mountHomeLamp(root: HTMLElement) {
  const lit = root.getElementsByClassName('home-lit')
  const visible = new Set<HTMLElement>()
  const observed = new WeakSet<Element>()
  const values = new WeakMap<HTMLElement, string>()
  const reduced = matchMedia('(prefers-reduced-motion: reduce)')
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)')
  const tilt = { x: 0, y: 0 }
  const lamp: Lamp = rest()
  const target: Lamp = rest()
  let frame = 0
  let lastFrame = 0
  let observedCount = -1
  let disposed = false

  // A stone title catches its one glint when it reaches the upper three quarters of the viewport.
  const titles = root.getElementsByClassName('home-stone-type')
  const glinted = new WeakSet<Element>()
  let titleCount = -1
  const reading = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue
      reading.unobserve(entry.target)
      if (!reduced.matches) entry.target.setAttribute('data-glint', '')
    }
  }, { rootMargin: '0px 0px -25% 0px', threshold: 1 })

  const intersection = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const element = entry.target as HTMLElement
      if (entry.isIntersecting) visible.add(element)
      else visible.delete(element)
    }
    request()
  }, { rootMargin: '120px 0px' })

  function rest(): Lamp {
    return { x: innerWidth * (restX + tilt.x * 0.45), y: innerHeight * (restY + tilt.y * 0.35), z: restHeight, near: 0 }
  }

  function observe() {
    if (titles.length !== titleCount) {
      titleCount = titles.length
      for (const title of titles) {
        if (glinted.has(title)) continue
        glinted.add(title)
        reading.observe(title)
      }
    }
    if (lit.length === observedCount) return
    observedCount = lit.length
    for (const element of lit) {
      if (observed.has(element)) continue
      observed.add(element)
      intersection.observe(element)
    }
  }

  function request() {
    if (!frame && !disposed) frame = requestAnimationFrame(render)
  }

  function render(now: number) {
    frame = 0
    const delta = lastFrame ? Math.min(now - lastFrame, 64) : 16
    observe()
    const instant = reduced.matches
    const ease = instant ? 1 : 1 - Math.exp(-delta / settleMs)
    lamp.x += (target.x - lamp.x) * ease
    lamp.y += (target.y - lamp.y) * ease
    lamp.z += (target.z - lamp.z) * ease
    lamp.near += (target.near - lamp.near) * ease
    for (const element of visible) {
      if (!element.isConnected) {
        visible.delete(element)
        continue
      }
      light(element)
    }
    const moving = Math.abs(target.x - lamp.x) + Math.abs(target.y - lamp.y) + Math.abs(target.z - lamp.z) > 0.5
      || Math.abs(target.near - lamp.near) > 0.004
    // A lamp at rest restarts from a single frame's step, not from the time it spent resting.
    lastFrame = moving ? now : 0
    if (moving) request()
  }

  function light(element: HTMLElement) {
    const rect = element.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    const lit = lampValues(rect, lamp)
    const key = lit.join('|')
    if (values.get(element) === key) return
    values.set(element, key)
    lit.forEach((value, index) => element.style.setProperty(litProperties[index], value))
  }

  function onPointer(event: PointerEvent) {
    if (event.pointerType !== 'mouse' || !finePointer.matches || reduced.matches) return
    target.x = event.clientX
    target.y = event.clientY - 40
    target.z = pointerHeight
    target.near = 1
    request()
  }

  function onLeave() {
    Object.assign(target, rest())
    request()
  }

  // A focused control may be lit itself or hold the stone it moves, as the theme slider holds its handle.
  function litFor(element: Element | null) {
    if (!element?.closest) return null
    return element.closest<HTMLElement>('.home-lit') ?? element.querySelector<HTMLElement>('.home-stone.home-lit')
  }

  function onFocus(event: FocusEvent) {
    const focused = event.target as Element | null
    const element = litFor(focused)
    if (!element || !focused?.matches(':focus-visible')) return
    const rect = element.getBoundingClientRect()
    target.x = rect.left + rect.width * 0.4
    target.y = rect.top - Math.min(120, rect.height + 60)
    target.z = pointerHeight
    target.near = 0.7
    request()
  }

  function onBlur(event: FocusEvent) {
    if (litFor(event.relatedTarget as Element | null)) return
    onLeave()
  }

  function onOrient(event: DeviceOrientationEvent) {
    if (reduced.matches || event.beta === null || event.gamma === null) return
    // Relative to a phone held at a comfortable reading angle, as the hero reads it.
    tilt.x = clamp(event.gamma / 25, -1, 1)
    tilt.y = clamp((event.beta - 40) / 25, -1, 1)
    if (target.near === 0) {
      Object.assign(target, rest())
      request()
    }
  }

  function onResize() {
    if (target.near === 0) Object.assign(target, rest())
    if (lamp.near === 0) Object.assign(lamp, rest())
    request()
  }

  observe()
  addEventListener('scroll', request, { passive: true })
  addEventListener('resize', onResize, { passive: true })
  document.addEventListener('pointermove', onPointer, { passive: true })
  document.documentElement.addEventListener('pointerleave', onLeave)
  root.addEventListener('focusin', onFocus)
  root.addEventListener('focusout', onBlur)
  // Only browsers that grant orientation without a permission prompt take part.
  const coarse = matchMedia('(pointer: coarse)').matches
  if (coarse) addEventListener('deviceorientation', onOrient)
  request()

  return () => {
    disposed = true
    cancelAnimationFrame(frame)
    intersection.disconnect()
    reading.disconnect()
    removeEventListener('scroll', request)
    removeEventListener('resize', onResize)
    document.removeEventListener('pointermove', onPointer)
    document.documentElement.removeEventListener('pointerleave', onLeave)
    root.removeEventListener('focusin', onFocus)
    root.removeEventListener('focusout', onBlur)
    if (coarse) removeEventListener('deviceorientation', onOrient)
  }
}

/**
 * The lamp relative to one element, in the order of `litProperties`. Values are rounded to what the eye
 * can tell apart, so a moving lamp restyles an element only when its light visibly changes.
 */
export function lampValues(box: Box, lamp: Lamp): string[] {
  const dx = lamp.x - (box.left + box.width / 2)
  const dy = lamp.y - (box.top + box.height / 2)
  const planar = Math.hypot(dx, dy) || 1
  // The shadow grows as the lamp leans away from overhead, and falls opposite the lamp.
  const cast = 2 + planar / (planar + lamp.z) * 9
  // Closeness counts from the element's edge, so a large frame catches a lamp passing over any part of it.
  const outside = Math.hypot(Math.max(box.left - lamp.x, 0, lamp.x - box.left - box.width), Math.max(box.top - lamp.y, 0, lamp.y - box.top - box.height))
  return [
    `${clamp((lamp.x - box.left) / box.width * 100, -60, 160).toFixed(1)}%`,
    `${clamp((lamp.y - box.top) / box.height * 100, -220, 160).toFixed(1)}%`,
    `${(Math.atan2(dx, -dy) * 180 / Math.PI).toFixed(0)}deg`,
    `${(-dx / planar * cast).toFixed(1)}px`,
    `${(Math.max(-dy / planar, 0.25) * cast).toFixed(1)}px`,
    (Math.exp(-(outside * outside) / (nearRadius * nearRadius)) * lamp.near).toFixed(2)
  ]
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}
