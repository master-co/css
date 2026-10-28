'use client'

import { useEffect } from 'react'

/** The order the stage tours its frameworks: integrations alternate so each step lights a new path. */
const stageOrder = [0, 11, 8, 13, 2, 12, 14, 4, 15, 9, 1, 3, 5, 10, 6, 7]

const durations = { stage: 2800, repo: 4600, routes: 5600 }

interface Tour {
  hold: () => void
  release: () => void
  stop: () => void
  dispose: () => void
}

/**
 * Steps a figure while it is in view. Pointer or focus inside holds it; `stop` ends it for good.
 * The figure is marked `data-wf-touring` while it steps, and `data-wf-offscreen` while hidden,
 * which pauses its CSS loops.
 */
function createTour(root: HTMLElement, duration: number, step: () => void, reduceMotion: boolean): Tour {
  let visible = false
  let held = false
  let stopped = reduceMotion
  let timer = 0
  const schedule = () => {
    window.clearTimeout(timer)
    const touring = visible && !held && !stopped
    root.toggleAttribute('data-wf-touring', touring)
    if (touring) {
      timer = window.setTimeout(() => {
        step()
        schedule()
      }, duration)
    }
  }
  const intersection = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting
    root.toggleAttribute('data-wf-offscreen', !visible)
    schedule()
  }, { threshold: 0.35 })
  intersection.observe(root)
  const hold = () => {
    held = true
    schedule()
  }
  const release = () => {
    held = false
    schedule()
  }
  const onFocusOut = (event: FocusEvent) => {
    if (!root.contains(event.relatedTarget as Node | null)) release()
  }
  root.addEventListener('pointerenter', hold)
  root.addEventListener('pointerleave', release)
  root.addEventListener('focusin', hold)
  root.addEventListener('focusout', onFocusOut)
  return {
    hold,
    release,
    stop() {
      stopped = true
      schedule()
    },
    dispose() {
      window.clearTimeout(timer)
      intersection.disconnect()
      root.removeEventListener('pointerenter', hold)
      root.removeEventListener('pointerleave', release)
      root.removeEventListener('focusin', hold)
      root.removeEventListener('focusout', onFocusOut)
    }
  }
}

/** Marks every element whose `data-trace` word list includes `key`, and unmarks the rest. */
function light(root: HTMLElement, key: string) {
  for (const element of root.querySelectorAll<HTMLElement | SVGElement>('[data-trace]')) {
    element.toggleAttribute('data-lit', element.dataset.trace!.split(' ').includes(key))
  }
}

/** The stage: a signal climbs to one framework at a time; pointing at or focusing one traces it. */
function wireStage(root: HTMLElement, reduceMotion: boolean) {
  let current = '0'
  const shown = () => {
    const stage = [...root.querySelectorAll<HTMLElement>('.home-wf-stage')].find((element) => element.offsetParent !== null)
    return new Set([...stage?.querySelectorAll<HTMLElement>('[data-wf-node]') ?? []].map((node) => node.dataset.wfNode!))
  }
  const show = (key: string) => {
    if (key === current) return
    current = key
    light(root, key)
  }
  const tour = createTour(root, durations.stage, () => {
    const visible = shown()
    const order = stageOrder.map(String).filter((key) => visible.has(key))
    show(order[(order.indexOf(current) + 1) % order.length] ?? order[0])
  }, reduceMotion)
  const pick = (event: Event) => {
    const node = (event.target as Element).closest<HTMLElement>('[data-wf-node]')
    if (node && root.contains(node)) show(node.dataset.wfNode!)
  }
  root.addEventListener('pointerover', pick)
  root.addEventListener('focusin', pick)
  // Depth parallax: the pointer's offset from the stage's center, for the chips to drift against the plates.
  let frame = 0
  const drift = (event: PointerEvent) => {
    if (reduceMotion || event.pointerType !== 'mouse') return
    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(() => {
      const rect = root.getBoundingClientRect()
      const clamp = (value: number) => Math.max(-1, Math.min(1, value))
      root.style.setProperty('--home-wf-px', clamp((event.clientX - rect.left) / rect.width * 2 - 1).toFixed(3))
      root.style.setProperty('--home-wf-py', clamp((event.clientY - rect.top) / rect.height * 2 - 1).toFixed(3))
    })
  }
  const settle = () => {
    cancelAnimationFrame(frame)
    root.style.removeProperty('--home-wf-px')
    root.style.removeProperty('--home-wf-py')
  }
  root.addEventListener('pointermove', drift)
  root.addEventListener('pointerleave', settle)
  return () => {
    tour.dispose()
    cancelAnimationFrame(frame)
    root.removeEventListener('pointerover', pick)
    root.removeEventListener('focusin', pick)
    root.removeEventListener('pointermove', drift)
    root.removeEventListener('pointerleave', settle)
  }
}

/** The monorepo: the two apps take turns, and pointing at one holds it. */
function wireRepo(root: HTMLElement, reduceMotion: boolean) {
  const count = new Set([...root.querySelectorAll<HTMLElement>('[data-wf-node]')].map((node) => node.dataset.wfNode)).size
  const show = (index: number) => {
    root.dataset.active = String(index)
  }
  const tour = createTour(root, durations.repo, () => show((Number(root.dataset.active) + 1) % count), reduceMotion)
  const pick = (event: Event) => {
    const node = (event.target as Element).closest<HTMLElement>('[data-wf-node]')
    if (node && root.contains(node)) show(Number(node.dataset.wfNode))
  }
  root.addEventListener('pointerover', pick)
  return () => {
    tour.dispose()
    root.removeEventListener('pointerover', pick)
  }
}

/** The routes: the radios take turns while the figure is in view; choosing one ends the tour. */
function wireRoutes(root: HTMLElement, reduceMotion: boolean) {
  const radios = [...root.querySelectorAll<HTMLInputElement>('input[type="radio"]')]
  const tour = createTour(root, durations.routes, () => {
    const index = radios.findIndex((radio) => radio.checked)
    radios[(index + 1) % radios.length].checked = true
  }, reduceMotion)
  // A real choice arrives as a click (a label or the keyboard); programmatic changes do not.
  const stop = () => tour.stop()
  radios.forEach((radio) => {
    radio.addEventListener('click', stop)
    radio.addEventListener('change', stop)
  })
  return () => {
    tour.dispose()
    radios.forEach((radio) => {
      radio.removeEventListener('click', stop)
      radio.removeEventListener('change', stop)
    })
  }
}

/** The impact graph: the change loops while in view; pressing a node pins its trace. */
function wireTrace(root: HTMLElement) {
  const nodes = [...root.querySelectorAll<HTMLButtonElement>('button[data-node]')]
  const press = (event: Event) => {
    const node = (event.target as Element).closest<HTMLButtonElement>('button[data-node]')
    if (!node) return
    const pressed = node.getAttribute('aria-pressed') !== 'true'
    nodes.forEach((other) => other.setAttribute('aria-pressed', String(other === node && pressed)))
  }
  const intersection = new IntersectionObserver(([entry]) => {
    root.toggleAttribute('data-wf-offscreen', !entry.isIntersecting)
  })
  intersection.observe(root)
  root.addEventListener('click', press)
  return () => {
    intersection.disconnect()
    root.removeEventListener('click', press)
  }
}

/**
 * Brings the Workflow figures to life from their server-rendered markup: tours while in view,
 * pointer and focus tracing, and pausing off screen. Renders nothing itself.
 */
export function WorkflowTours({ sectionId }: { sectionId: string }) {
  useEffect(() => {
    const section = document.getElementById(sectionId)
    if (!section) return
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
    const figure = (name: string) => section.querySelector<HTMLElement>(`[data-wf="${name}"]`)
    const cleanups = [
      figure('stage') && wireStage(figure('stage')!, reduceMotion),
      figure('repo') && wireRepo(figure('repo')!, reduceMotion),
      figure('routes') && wireRoutes(figure('routes')!, reduceMotion),
      figure('trace') && wireTrace(figure('trace')!)
    ]
    return () => cleanups.forEach((cleanup) => cleanup && cleanup())
  }, [sectionId])

  return null
}

export default WorkflowTours
