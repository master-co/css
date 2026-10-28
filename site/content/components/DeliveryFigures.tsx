'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { IconPlayerPauseFilled, IconPlayerPlayFilled, IconRotate } from '@tabler/icons-react'
import { useTranslation } from '~/site/docs-shell/contexts/i18n'
import { deliveryAdded, deliveryLateClass, deliveryMoments, deliveryRuleAt, deliveryTiming, type DeliveryMode } from './delivery-content'

/** Milliseconds per moment while a mode plays, and the rest before the tour moves on. */
const unit = 2100
const rest = 2200
/** How far ahead of its moment, in timeline units, a flight leaves so it lands on time. */
const rainLead = 0.32
const carryLead = 0.36

type Playback = 'playing' | 'paused' | 'ended'

interface Controls {
  seek: (moment: number) => void
  toggle: () => void
}

/**
 * The Rendering section's timeline: template, CSS, first paint, and a new class that the
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
  const [ready, setReady] = useState(false)
  const controls = useRef<Controls>(null)

  useEffect(() => {
    const section = document.getElementById(sectionId)
    const stage = section?.querySelector<HTMLElement>('.home-delivery-stage')
    const frame = section?.querySelector<HTMLElement>('.home-delivery-figure')
    const layer = stage?.querySelector<HTMLElement>('.home-delivery-flights')
    const routes = stage?.querySelector<SVGSVGElement>('.home-delivery-routes')
    const add = stage?.querySelector<HTMLButtonElement>('[data-add-class]')
    const inspectButtons = stage ? [...stage.querySelectorAll<HTMLButtonElement>('[data-inspect-css]')] : []
    const views = stage ? [...stage.querySelectorAll<HTMLInputElement>('input[name="home-delivery-view"]')] : []
    const previewHost = stage?.querySelector<HTMLElement>('[data-preview-host]')
    const preview = previewHost?.shadowRoot
    const plan = preview?.querySelector<HTMLElement>('[data-preview-plan]')
    const previewSelect = preview?.querySelector<HTMLButtonElement>('[data-preview-select]')
    const radios = section ? [...section.querySelectorAll<HTMLInputElement>('input[name="home-delivery-mode"]')] : []
    if (!section || !stage || !frame || !layer || !routes || !add || !inspectButtons.length || !views.length || !preview || !plan || !previewSelect || !radios.length) return
    const preference = matchMedia('(prefers-reduced-motion: reduce)')
    let reduce = preference.matches

    let t = 4
    let shown = 3
    let playing = false
    let touring = !reduce
    let scrubbed = false
    let held = false
    let visible = false
    let inView = false
    let clock = 0
    let endedAt = 0
    let releasedAt = 0
    let last = 0
    let frameId = 0
    let filmMode = ''
    let begun = false
    let tween: { from: number, to: number, start: number, moment: number } | undefined
    let events: { at: number, run: () => void }[] = []
    const animations = new Set<Animation>()
    const timers = new Set<{ at: number, run: () => void }>()

    const mode = () => (radios.find((radio) => radio.checked)?.value ?? 'static') as DeliveryMode
    const ruleStyles = [...preview.querySelectorAll<HTMLStyleElement>('style[data-delivery-rule]')].map(style => ({ style, className: style.dataset.deliveryRule!, text: `@layer utilities{${style.dataset.ruleText}}` }))
    let previewKey = ''
    let viewPinned = false
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
      return changed
    }
    const updateView = () => {
      if (viewPinned) return
      const reference = deliveryTiming[mode()].reference
      const next = t < reference + .25 || (t >= 2.7 && t < 3.28) ? 'template' : 'css'
      const view = views.find(view => view.value === next)!
      if (!view.checked) { view.checked = true; drawRoutes() }
    }
    const updatePreview = () => {
      const current = mode()
      stage.style.setProperty('--delivery-reference-on', String(Math.max(0, Math.min(1, (t - deliveryTiming[current].reference) * 10))))
      const timing = deliveryTiming[current]
      const late = t >= deliveryAdded
      const available = t >= (current === 'static' ? timing.sheet : timing.latePaint)
      const key = `${current}|${late}|${ruleStyles.map(({ className: rule }) => {
        const activeAt = current === 'static' ? timing.sheet : rule === deliveryLateClass ? timing.latePaint : current === 'progressive' ? timing.sheet : deliveryRuleAt(current, rule)
        return t >= activeAt ? '1' : '0'
      }).join('')}`
      if (key !== previewKey) {
        previewKey = key
        plan.classList.toggle(deliveryLateClass, late)
        plan.toggleAttribute('data-selected', late && available)
        plan.toggleAttribute('data-pending', late && !available)
        previewSelect.setAttribute('aria-pressed', String(late && available))
        previewSelect.setAttribute('aria-disabled', String(late))
        previewSelect.setAttribute('aria-busy', String(late && !available))
        const availability = key.slice(key.lastIndexOf('|') + 1)
        ruleStyles.forEach(({ style, text }, index) => {
          const next = availability[index] === '1' ? text : ''
          if (style.textContent !== next) style.textContent = next
        })
      }
      const from = current === 'static' ? deliveryAdded : timing.lateRule
      previewHost!.style.setProperty('--preview-flash', String(Math.max(0, Math.min(1, (t - from) * 12, (from + .38 - t) * 8))))
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
      setPlayback(value ? 'playing' : t >= 4 ? 'ended' : 'paused')
    }
    const setT = (value: number) => {
      t = Math.min(4, Math.max(0, value))
      stage.style.setProperty('--home-delivery-t', t.toFixed(3))
      updatePreview()
      const changed = updateRows()
      updateView()
      if (changed) drawRoutes()
      const next = tween?.moment ?? Math.min(3, Math.max(0, Math.ceil(t - 0.0001) - 1))
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

    /** A class is one readable unit: input token, processor, then an actual CSS rule. */
    const rain = (className: string, line: HTMLElement) => {
      if (!belongs(line)) return
      const engine = find(stage, `[data-ring="${line.dataset.engine}"]`)
      const scope = find(stage, `[data-carry-source="${line.dataset.glyphSource}"]`)
      let source = scope && find(scope, `[data-glyph="${className}"]`)
      const viewport = source?.closest('.home-delivery-code-scroll')?.getBoundingClientRect()
      const word = source?.getBoundingClientRect()
      if (!source || (viewport && word && (word.top < viewport.top || word.bottom > viewport.bottom))) source = find(stage, 'label[for="home-delivery-view-template"]')
      const ring = engine?.querySelector<HTMLElement>('.home-delivery-engine-core')
      if (!source || !ring) return
      const from = local(source)
      const to = local(ring)
      const chip = document.createElement('span')
      chip.dataset.flight = 'class'
      chip.textContent = className
      layer.append(chip)
      const width = chip.offsetWidth
      const height = chip.offsetHeight
      const x0 = from.x + from.width / 2 - width / 2
      const y0 = from.y + from.height / 2 - height / 2
      const x1 = to.x + to.width / 2 - width / 2
      const y1 = to.y + to.height / 2 - height / 2
      source.dataset.hot = ''
      later(() => delete source.dataset.hot, 700)
      track(chip.animate([
        { transform: `translate(${x0}px, ${y0}px) scale(.94)`, opacity: 0 },
        { transform: `translate(${x0 + (x1 - x0) * .12}px, ${y0 + (y1 - y0) * .12 - 8}px)`, opacity: 1, offset: .16 },
        { transform: `translate(${(x0 + x1) / 2}px, ${(y0 + y1) / 2 - 12}px)`, opacity: 1, offset: .55 },
        { transform: `translate(${x1}px, ${y1}px) scale(.65)`, opacity: 0 }
      ], { duration: 670, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'both' }), chip)
      later(() => pulse(ring), 590)
    }

    /** A file or element name travels from one station to the next. */
    const carry = (label: string, fromKey: string, target: HTMLElement) => {
      const source = find(stage, `[data-carry-source="${fromKey}"]`)
      if (!source || !isShown(target)) return
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
      const path = routes.querySelector<SVGPathElement>('[data-route="paint"]')
      const frames: Keyframe[] = [{ transform: `translate(${x0}px, ${y0}px) scale(0.92)`, opacity: 0, offset: 0 }]
      if (path?.hasAttribute('d')) {
        const pathBox = routes.getBoundingClientRect()
        const layerBox = layer.getBoundingClientRect()
        const length = path.getTotalLength()
        for (let index = 0; index <= 16; index++) {
          const point = path.getPointAtLength(length * index / 16)
          const x = point.x + pathBox.left - layerBox.left - width / 2
          const y = point.y + pathBox.top - layerBox.top - height / 2
          frames.push({ transform: `translate(${x}px, ${y}px)`, opacity: 1, offset: 0.1 + index / 16 * 0.75 })
        }
      }
      frames.push(
        { transform: `translate(${x1}px, ${y1}px) scale(0.96)`, opacity: 1, offset: 0.94 },
        { transform: `translate(${x1}px, ${y1}px) scale(0.9)`, opacity: 0, offset: 1 }
      )
      const duration = Math.max(180, Number(target.dataset.lead ?? carryLead) * unit)
      const animation = chip.animate(frames, { duration, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', fill: 'both' })
      track(animation, chip)
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
        events.push({ at: Number(line.dataset.at) - rainLead, run: () => rain(line.dataset.land!, line) })
      })
      stage.querySelectorAll<HTMLElement>('[data-carry]').forEach((target) => {
        if (!isShown(target)) return
        events.push({ at: Number(target.dataset.at) - Number(target.dataset.lead ?? carryLead), run: () => carry(target.dataset.carry!, target.dataset.carryFrom!, target) })
      })
    }
    const advance = (to: number) => {
      // On a film's first frame, flights that had to leave before it (to land early in the build) leave at once.
      const from = begun ? t : -Infinity
      if (from < 3 && to >= 3) focusCode('[data-edit-line]')
      begun = true
      if (!reduce) for (const event of events) if (event.at > from && event.at <= to) event.run()
      setT(to)
    }
    const film = () => {
      cancel()
      stage.removeAttribute('data-inspecting')
      viewPinned = false
      views[0].checked = true
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
      frameId = requestAnimationFrame(tick)
      const elapsed = last ? Math.min(now - last, 64) : 0
      last = now
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
        clock += elapsed
        for (const timer of timers) {
          if (timer.at > clock) continue
          timers.delete(timer)
          timer.run()
        }
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
        updatePreview()
        collect()
        redraw()
      } else {
        film()
      }
    }
    const focusCode = (selector: string) => {
      views[0].checked = true
      const line = find(stage, selector)
      const scroll = line?.closest<HTMLElement>('.home-delivery-code-scroll')
      if (line && scroll) {
        const row = line.getBoundingClientRect()
        const view = scroll.getBoundingClientRect()
        if (row.top < view.top + 44 || row.bottom > view.bottom - 44) scroll.scrollTop += row.top - view.top - view.height * .42
      }
    }
    const onInspect = () => {
      touring = false
      stage.removeAttribute('data-touring')
      cancel()
      tween = undefined
      setPlaying(false)
      viewPinned = true
      views[0].checked = true
      if (t < deliveryTiming[mode()].reference + .15) setT(Math.max(2, deliveryTiming[mode()].reference + .2))
      focusCode('[data-reference-line]')
      stage.setAttribute('data-inspecting', '')
      if (views[0].getClientRects().length) views[0].focus({ preventScroll: true })
      redraw()
    }
    const onClick = () => choose(true)
    const onChange = () => choose(false)
    const onAdd = () => {
      touring = false
      stage.removeAttribute('data-touring')
      cancel()
      tween = undefined
      filmMode = mode()
      begun = true
      scrubbed = false
      clock = 0
      stage.removeAttribute('data-inspecting')
      viewPinned = reduce
      views[0].checked = true
      setT(reduce ? 4 : 3)
      focusCode('[data-edit-line]')
      shown = 3
      stage.dataset.moment = '3'
      setMoment(3)
      collect()
      setPlaying(!reduce)
    }
    add.addEventListener('click', onAdd)
    const onPreviewSelect = () => { if (previewSelect.getAttribute('aria-disabled') !== 'true') onAdd() }
    previewSelect.addEventListener('click', onPreviewSelect)
    inspectButtons.forEach(button => button.addEventListener('click', onInspect))
    const onView = () => {
      viewPinned = true
      touring = false
      stage.removeAttribute('data-touring')
      cancel()
      tween = undefined
      setPlaying(false)
      drawRoutes()
    }
    views.forEach(view => view.addEventListener('change', onView))
    radios.forEach((radio) => {
      radio.addEventListener('click', onClick)
      radio.addEventListener('change', onChange)
    })

    controls.current = {
      seek(index) {
        touring = false
        stage.removeAttribute('data-touring')
        scrubbed = true
        viewPinned = true
        begun = true
        cancel()
        setPlaying(false)
        if (reduce) setT(index + 1)
        else tween = { from: t, to: index + 1, start: performance.now(), moment: index }
        shown = index
        stage.dataset.moment = String(index)
        setMoment(index)
        if (index === 3) focusCode('[data-edit-line]')
        else if (index === 1) focusCode('[data-reference-line]')
        else if (index === 0) stage.querySelectorAll('.home-delivery-template .home-delivery-code-scroll').forEach(scroll => { scroll.scrollTop = 0 })
        redraw()
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
    const updateVisibility = () => {
      visible = inView && !document.hidden
      stage.toggleAttribute('data-visible', visible)
      syncAnimations()
      last = 0
    }
    const intersection = new IntersectionObserver(([entry]) => {
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
      setT(4)
      setPlaying(false)
      setMotion(!reduce)
    }
    preference.addEventListener('change', onPreference)
    const drawRoutes = () => {
      const bounds = routes.getBoundingClientRect()
      const boxes = ['template', 'css', 'browser'].map((name) => {
        const element = stage.querySelector(`[data-station="${name}"]`)!
        const visibleCode = stage.querySelector('.home-delivery-template')!.getBoundingClientRect().width > 0 ? stage.querySelector('.home-delivery-template')! : stage.querySelector('.home-delivery-css')!
        const box = element.getBoundingClientRect().width ? element.getBoundingClientRect() : visibleCode.getBoundingClientRect()
        return { x: box.left - bounds.left, y: box.top - bounds.top, right: box.right - bounds.left, bottom: box.bottom - bounds.top, cx: box.left - bounds.left + box.width / 2, cy: box.top - bounds.top + box.height / 2 }
      })
      const [template, css, browser] = boxes
      const ring = stage.querySelector('.home-delivery-engine-core')!.getBoundingClientRect()
      const processor = { x: ring.left - bounds.left, right: ring.right - bounds.left, y: ring.top - bounds.top, bottom: ring.bottom - bounds.top, cx: ring.left - bounds.left + ring.width / 2, cy: ring.top - bounds.top + ring.height / 2 }
      const wide = css.x > template.right
      const reference = find(stage, '[data-css-reference]')?.getBoundingClientRect()
      const refY = reference ? Math.max(template.y + 60, Math.min(template.bottom - 50, reference.top - bounds.top + reference.height / 2)) : template.y + 120
      const paths = {
        input: wide ? `M${template.right} ${processor.cy}H${processor.x}` : `M${template.cx} ${template.bottom}V${processor.y}`,
        rules: wide ? `M${processor.right} ${processor.cy}H${css.x}` : `M${processor.right} ${processor.cy}H${css.right + 10}V${css.y + 70}H${css.right}`,
        reference: wide ? `M${template.right - 12} ${refY}H${css.x + 20}V${css.y + 44}` : `M${template.right} ${refY}H${template.right + 12}V${css.y + 24}H${css.right - 16}`,
        paint: browser.x > css.x ? `M${css.right - 18} ${css.cy}H${browser.x + 24}` : `M${css.cx} ${css.bottom - 18}V${browser.y + 24}`
      }
      const mobileTabs = stage.querySelector('.home-delivery-mobile-tabs')!.getBoundingClientRect()
      if (mobileTabs.width) {
        const left = stage.querySelector('label[for="home-delivery-view-template"]')!.getBoundingClientRect()
        const right = stage.querySelector('label[for="home-delivery-view-css"]')!.getBoundingClientRect()
        const y0 = left.top - bounds.top + left.height / 2
        const y1 = right.top - bounds.top + right.height / 2
        paths.input = `M${left.right - bounds.left} ${y0}H${processor.x - 8}V${processor.cy}H${processor.x}`
        paths.rules = `M${processor.right} ${processor.cy}H${right.left - bounds.left - 8}V${y1}H${right.left - bounds.left}`
        paths.paint = `M${css.cx} ${css.bottom - 18}V${browser.y + 24}`
      }
      routes.setAttribute('viewBox', `0 0 ${bounds.width} ${bounds.height}`)
      for (const [name, path] of Object.entries(paths)) routes.querySelector(`[data-route="${name}"]`)!.setAttribute('d', path)
      stage.setAttribute('data-routed', '')
    }
    const redraw = () => { cancel(); drawRoutes() }
    const resize = new ResizeObserver(redraw)
    resize.observe(layer)
    const scrolls = [...stage.querySelectorAll('.home-delivery-code-scroll')]
    scrolls.forEach(scroll => scroll.addEventListener('scroll', redraw, { passive: true }))
    const onCodeFocus = () => {
      viewPinned = true
      touring = false
      stage.removeAttribute('data-touring')
      tween = undefined
      setPlaying(false)
      cancel()
    }
    scrolls.forEach(scroll => scroll.addEventListener('focus', onCodeFocus))

    filmMode = mode()
    collect()
    setReady(true)
    add.disabled = false
    inspectButtons.forEach(button => { button.disabled = false })
    previewSelect.disabled = false
    updatePreview()
    updateRows()
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
      resize.disconnect()
      scrolls.forEach(scroll => scroll.removeEventListener('scroll', redraw))
      scrolls.forEach(scroll => scroll.removeEventListener('focus', onCodeFocus))
      stage.removeAttribute('data-routed')
      add.removeEventListener('click', onAdd)
      previewSelect.removeEventListener('click', onPreviewSelect)
      inspectButtons.forEach(button => { button.removeEventListener('click', onInspect); button.disabled = true })
      views.forEach(view => view.removeEventListener('change', onView))
      add.disabled = true
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
          <button aria-pressed={moment === index} className="home-delivery-moment" disabled={!ready} key={item.id} onClick={() => controls.current?.seek(index)} style={{ '--i': index } as CSSProperties} type="button">
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
