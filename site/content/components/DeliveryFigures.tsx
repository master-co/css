'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { IconPlayerPauseFilled, IconPlayerPlayFilled, IconRotate } from '@tabler/icons-react'
import { useTranslation } from '~/site/docs-shell/contexts/i18n'
import { deliveryMoments } from './delivery-content'

/** Milliseconds per moment while a mode plays, and the rest before the tour moves on. */
const unit = 2100
const rest = 2200
/** How far ahead of its moment, in timeline units, a flight leaves so it lands on time. */
const rainLead = 0.3
const carryLead = 0.36
const glyphs = 'abcdefghijklmnopqrstuvwxyz0123456789-:;{}()'

type Playback = 'playing' | 'paused' | 'ended'

interface Controls {
  seek: (moment: number) => void
  toggle: () => void
}

/**
 * The Rendering section's timeline: four moments (build, response, first paint, new class) that the
 * stage plays for the chosen mode. While in view the section tours the modes; pointer or focus inside
 * holds the current mode, and choosing a mode or a moment ends the tour. The stage is server-rendered
 * at its last moment; this island writes `--home-delivery-t` and flies class glyphs and files between
 * the stations. Reduced motion keeps the last moment and lets the moments be chosen directly.
 */
export default function DeliveryFigures({ sectionId }: { sectionId: string }) {
  const $ = useTranslation()
  const [moment, setMoment] = useState(3)
  const [playback, setPlayback] = useState<Playback>('ended')
  const [motion, setMotion] = useState(false)
  const controls = useRef<Controls>(null)

  useEffect(() => {
    const section = document.getElementById(sectionId)
    const stage = section?.querySelector<HTMLElement>('.home-delivery-stage')
    const frame = section?.querySelector<HTMLElement>('.home-delivery-figure')
    const layer = stage?.querySelector<HTMLElement>('.home-delivery-flights')
    const radios = section ? [...section.querySelectorAll<HTMLInputElement>('input[name="home-delivery-mode"]')] : []
    if (!section || !stage || !frame || !layer || !radios.length) return
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches

    let t = 4
    let shown = 3
    let playing = false
    let touring = !reduce
    let scrubbed = false
    let held = false
    let visible = false
    let endedAt = 0
    let releasedAt = 0
    let last = 0
    let frameId = 0
    let filmMode = ''
    let begun = false
    let tween: { from: number, to: number, start: number } | undefined
    let events: { at: number, run: () => void }[] = []
    const animations = new Set<Animation>()
    const timers = new Set<number>()
    const decoding = new Map<Text, { original: string, start: number, end: number, offset: number, total: number }>()

    const mode = () => radios.find((radio) => radio.checked)?.value ?? 'static'
    const setPlaying = (value: boolean) => {
      playing = value
      stage.toggleAttribute('data-playing', value)
      setPlayback(value ? 'playing' : t >= 4 ? 'ended' : 'paused')
    }
    const setT = (value: number) => {
      t = Math.min(4, Math.max(0, value))
      stage.style.setProperty('--home-delivery-t', t.toFixed(3))
      const next = Math.min(3, Math.max(0, Math.ceil(t - 0.0001) - 1))
      if (next !== shown) {
        shown = next
        stage.dataset.moment = String(next)
        setMoment(next)
      }
    }
    const later = (callback: () => void, delay: number) => {
      const id = window.setTimeout(() => {
        timers.delete(id)
        callback()
      }, delay)
      timers.add(id)
    }

    /* Flights: decorative copies that travel over the stage; they never touch its layout. */
    const isShown = (element: Element | null): element is HTMLElement => {
      if (!(element instanceof HTMLElement) || getComputedStyle(element).visibility !== 'visible') return false
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
      animation.finished.catch(() => undefined).finally(() => {
        animations.delete(animation)
        element.remove()
      })
    }
    const decode = (line: HTMLElement, duration = 460) => {
      const walker = document.createTreeWalker(line, NodeFilter.SHOW_TEXT)
      const nodes: Text[] = []
      while (walker.nextNode()) nodes.push(walker.currentNode as Text)
      const now = performance.now()
      const total = nodes.reduce((sum, node) => sum + (decoding.get(node)?.original ?? node.data).length, 0)
      let offset = 0
      for (const node of nodes) {
        const original = decoding.get(node)?.original ?? node.data
        decoding.set(node, { original, start: now, end: now + duration, offset, total })
        offset += original.length
      }
    }
    const stepDecodes = (now: number) => {
      for (const [node, state] of decoding) {
        const progress = (now - state.start) / (state.end - state.start)
        if (progress >= 1) {
          node.data = state.original
          decoding.delete(node)
          continue
        }
        // Characters settle left to right; the rest flicker through class glyphs.
        const settled = Math.floor(progress * state.total * 1.15) - state.offset
        node.data = [...state.original].map((char, index) => index < settled || char === ' ' ? char : glyphs[(Math.random() * glyphs.length) | 0]).join('')
      }
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

    /** A class name breaks into glyphs that fall into the engine; its rule then condenses on the line. */
    const rain = (className: string, line: HTMLElement) => {
      const station = line.closest('.home-delivery-station')
      if (!station || !isShown(line.closest('.home-delivery-variant'))) return
      const engine = find(station, '[data-ring]')
      const source = find(station, `.home-delivery-token[data-glyph="${className}"]`) ?? find(station, `[data-glyph~="${className}"]`)
      const ring = engine?.querySelector<HTMLElement>('.home-delivery-engine-ring')
      if (!engine || !source || !ring) return
      source.dataset.hot = ''
      later(() => delete source.dataset.hot, 520)
      const from = local(source)
      const to = local(ring)
      const token = source.classList.contains('home-delivery-token')
      const chars = [...className]
      chars.forEach((char, index) => {
        const glyph = document.createElement('span')
        glyph.dataset.flight = 'glyph'
        glyph.textContent = char
        layer.append(glyph)
        const x0 = token ? from.x + (index + 0.5) * (from.width / chars.length) : from.x + from.width * (0.15 + 0.7 * index / Math.max(1, chars.length - 1))
        const y0 = from.y + Math.min(from.height, 22) / 2
        const x1 = to.x + to.width / 2 + (Math.random() - 0.5) * to.width * 0.3
        const y1 = to.y + to.height / 2
        // Each glyph lifts off its class, leans in or out of the page, and converges on the ring.
        const depth = -70 + Math.random() * 130
        const drift = (Math.random() - 0.5) * 18
        const animation = glyph.animate([
          { transform: `translate3d(${x0}px, ${y0}px, 0) scale(1)`, opacity: 0 },
          { transform: `translate3d(${x0 + drift * 0.3}px, ${y0 - 5}px, ${depth * 0.35}px) scale(1)`, opacity: 0.95, offset: 0.16 },
          { transform: `translate3d(${x0 + (x1 - x0) * 0.45 + drift}px, ${y0 + (y1 - y0) * 0.5}px, ${depth}px) scale(0.95)`, opacity: 0.85, offset: 0.58 },
          { transform: `translate3d(${x1}px, ${y1}px, 0) scale(0.35)`, opacity: 0 }
        ], { duration: 600, delay: index * 22 + Math.random() * 40, easing: 'cubic-bezier(0.5, 0, 0.75, 0.45)', fill: 'both' })
        track(animation, glyph)
      })
      later(() => {
        pulse(ring)
        decode(line)
      }, 600)
    }

    /** A file or element name travels from one station to the next. */
    const carry = (label: string, fromKey: string, target: HTMLElement) => {
      const source = find(stage, `[data-carry-source="${fromKey}"]`)
      if (!source || !isShown(target)) return
      // On narrow screens one station shows at a time; a file only flies between stations both in view.
      const settled = (element: Element) => Number(getComputedStyle(element.closest('.home-delivery-station') ?? element).opacity) > 0.99
      if (!settled(source) || !settled(target)) return
      const from = local(source)
      const to = local(target)
      const chip = document.createElement('span')
      chip.dataset.flight = 'packet'
      chip.textContent = label
      layer.append(chip)
      const width = chip.offsetWidth
      const height = chip.offsetHeight
      const x0 = from.x + from.width / 2 - width / 2
      const y0 = from.y + from.height / 2 - height / 2
      const x1 = to.x + Math.min(to.width / 2, 120) - width / 2
      const y1 = to.y + to.height / 2 - height / 2
      const lift = Math.min(48, Math.abs(x1 - x0) * 0.12 + 12)
      const animation = chip.animate([
        { transform: `translate(${x0}px, ${y0}px) scale(0.92)`, opacity: 0 },
        { transform: `translate(${x0 + (x1 - x0) * 0.1}px, ${y0 + (y1 - y0) * 0.1 - lift * 0.4}px) scale(1)`, opacity: 1, offset: 0.14 },
        { transform: `translate(${(x0 + x1) / 2}px, ${(y0 + y1) / 2 - lift}px) scale(1)`, opacity: 1, offset: 0.5 },
        { transform: `translate(${x1}px, ${y1}px) scale(0.96)`, opacity: 1, offset: 0.88 },
        { transform: `translate(${x1}px, ${y1}px) scale(0.9)`, opacity: 0 }
      ], { duration: 820, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', fill: 'both' })
      track(animation, chip)
    }

    const cancel = () => {
      for (const animation of animations) animation.cancel()
      animations.clear()
      for (const id of timers) clearTimeout(id)
      timers.clear()
      for (const [node, state] of decoding) node.data = state.original
      decoding.clear()
      stage.querySelectorAll<HTMLElement>('[data-hot]').forEach((element) => delete element.dataset.hot)
      layer.replaceChildren()
    }
    const collect = () => {
      events = []
      stage.querySelectorAll<HTMLElement>('[data-land]').forEach((line) => {
        events.push({ at: Number(line.dataset.at) - rainLead, run: () => rain(line.dataset.land!, line) })
      })
      stage.querySelectorAll<HTMLElement>('[data-carry]').forEach((target) => {
        events.push({ at: Number(target.dataset.at) - carryLead, run: () => carry(target.dataset.carry!, target.dataset.carryFrom!, target) })
      })
    }
    const advance = (to: number) => {
      // On a film's first frame, flights that had to leave before it (to land early in the build) leave at once.
      const from = begun ? t : -Infinity
      begun = true
      if (!reduce) for (const event of events) if (event.at > from && event.at <= to) event.run()
      setT(to)
    }
    const film = () => {
      cancel()
      filmMode = mode()
      begun = false
      scrubbed = false
      tween = undefined
      setT(0)
      collect()
      setPlaying(true)
    }

    const tick = (now: number) => {
      frameId = requestAnimationFrame(tick)
      const elapsed = last ? Math.min(now - last, 64) : 0
      last = now
      if (decoding.size) stepDecodes(now)
      if (tween) {
        const progress = Math.min(1, (now - tween.start) / 620)
        const eased = 1 - (1 - progress) ** 3
        setT(tween.from + (tween.to - tween.from) * eased)
        if (progress >= 1) {
          tween = undefined
          setPlayback(t >= 4 ? 'ended' : 'paused')
        }
        return
      }
      if (!visible) return
      if (playing) {
        advance(t + elapsed / unit)
        if (t >= 4) {
          endedAt = now
          setPlaying(false)
        }
      } else if (touring && t >= 4 && !held && now - Math.max(endedAt, releasedAt) > rest) {
        const index = radios.findIndex((radio) => radio.checked)
        radios[(index + 1) % radios.length].checked = true
        film()
      }
    }

    const choose = (fromClick: boolean) => {
      touring = false
      stage.removeAttribute('data-touring')
      const next = mode()
      if (next === filmMode && !fromClick) return
      if (reduce || scrubbed) {
        cancel()
        filmMode = next
        collect()
      } else {
        film()
      }
    }
    const onClick = () => choose(true)
    const onChange = () => choose(false)
    radios.forEach((radio) => {
      radio.addEventListener('click', onClick)
      radio.addEventListener('change', onChange)
    })

    controls.current = {
      seek(index) {
        touring = false
        stage.removeAttribute('data-touring')
        scrubbed = true
        cancel()
        setPlaying(false)
        if (reduce) setT(index + 1)
        else tween = { from: t, to: index + 1, start: performance.now() }
        shown = index
        stage.dataset.moment = String(index)
        setMoment(index)
      },
      toggle() {
        touring = false
        stage.removeAttribute('data-touring')
        if (playing) {
          setPlaying(false)
        } else if (t >= 4) {
          film()
        } else {
          scrubbed = false
          tween = undefined
          collect()
          setPlaying(true)
        }
      }
    }

    // The radios sit before the figure, so focus on them holds the tour as focus inside the figure does.
    const inside = (node: EventTarget | null) => node instanceof Node && (frame.contains(node) || radios.includes(node as HTMLInputElement))
    const hold = () => {
      held = true
    }
    const release = (event: Event) => {
      if (event instanceof FocusEvent && inside(event.relatedTarget)) return
      held = false
      releasedAt = performance.now()
    }
    frame.addEventListener('pointerenter', hold)
    frame.addEventListener('pointerleave', release)
    frame.addEventListener('focusin', hold)
    frame.addEventListener('focusout', release)
    radios.forEach((radio) => {
      radio.addEventListener('focus', hold)
      radio.addEventListener('blur', release)
    })
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      stage.toggleAttribute('data-visible', visible)
      if (!visible) last = 0
    }, { threshold: 0.2 })
    intersection.observe(stage)

    filmMode = mode()
    collect()
    if (!reduce) {
      setMotion(true)
      stage.setAttribute('data-touring', '')
      setT(0)
      setPlaying(true)
    }
    frameId = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frameId)
      cancel()
      intersection.disconnect()
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
      controls.current = null
    }
  }, [$, sectionId])

  const playLabel = playback === 'playing' ? $('Pause') : playback === 'ended' ? $('Replay') : $('Play')

  return (
    <div className="home-delivery-player">
      {/* Every state renders on the server: the page runs on pre-rendered CSS, and a class that first appears in the browser would start its engine. */}
      <button aria-label={playLabel} className="home-delivery-play" data-playback={playback} hidden={!motion} onClick={() => controls.current?.toggle()} title={playLabel} type="button">
        <IconPlayerPauseFilled aria-hidden="true" data-icon="playing" size={12} stroke={1.75} />
        <IconPlayerPlayFilled aria-hidden="true" data-icon="paused" size={12} stroke={1.75} />
        <IconRotate aria-hidden="true" data-icon="ended" size={13} stroke={1.75} />
      </button>
      <div aria-label={$('Timeline')} className="home-delivery-timeline" role="group">
        {deliveryMoments.map((item, index) => (
          <button aria-pressed={moment === index} className="home-delivery-moment" key={item.id} onClick={() => controls.current?.seek(index)} style={{ '--i': index } as CSSProperties} type="button">
            <span className="home-delivery-moment-label">{$(item.label)}</span>
            <span aria-hidden="true" className="home-delivery-moment-track">
              <span className="home-delivery-moment-fill" />
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
