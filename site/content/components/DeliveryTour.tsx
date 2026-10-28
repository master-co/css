'use client'

import { useEffect } from 'react'

/** How long each rendering mode stays selected while the section tours them. */
const modeDuration = 5200

/**
 * Steps the rendering-mode radios while the diagram is in view, so each delivery path lights up in
 * turn. The tour pauses under the pointer or focus and stops for good once the reader picks a mode.
 * Progress is written to `--home-delivery-progress` on the section for the chosen card's hairline.
 */
export default function DeliveryTour({ sectionId }: { sectionId: string }) {
  useEffect(() => {
    const section = document.getElementById(sectionId)
    if (!section || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const radios = [...section.querySelectorAll<HTMLInputElement>('input[name="home-delivery-mode"]')]
    const stage = section.querySelector<HTMLElement>('.home-bento-frame')
    if (!radios.length || !stage) return
    let touring = true
    let visible = false
    let held = false
    let elapsed = 0
    let last = 0
    let frame = 0

    const setProgress = (value: number) => section.style.setProperty('--home-delivery-progress', value.toFixed(4))
    const stop = () => {
      touring = false
      section.removeAttribute('data-touring')
      cancelAnimationFrame(frame)
    }
    const tick = (time: number) => {
      frame = requestAnimationFrame(tick)
      if (!visible || held) {
        last = 0
        return
      }
      if (last) elapsed += Math.min(time - last, 100)
      last = time
      if (elapsed >= modeDuration) {
        elapsed = 0
        const index = radios.findIndex((radio) => radio.checked)
        radios[(index + 1) % radios.length].checked = true
      }
      setProgress(elapsed / modeDuration)
    }

    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
    }, { threshold: 0.4 })
    intersection.observe(stage)
    const hold = () => {
      held = true
    }
    const release = () => {
      held = false
    }
    stage.addEventListener('pointerenter', hold)
    stage.addEventListener('pointerleave', release)
    stage.addEventListener('focusin', hold)
    stage.addEventListener('focusout', release)
    // A real choice arrives as a click (a label or the keyboard); programmatic changes do not.
    radios.forEach((radio) => {
      radio.addEventListener('click', stop)
      radio.addEventListener('change', stop)
    })
    section.setAttribute('data-touring', '')
    setProgress(0)
    frame = requestAnimationFrame(tick)

    return () => {
      if (touring) stop()
      intersection.disconnect()
      stage.removeEventListener('pointerenter', hold)
      stage.removeEventListener('pointerleave', release)
      stage.removeEventListener('focusin', hold)
      stage.removeEventListener('focusout', release)
      radios.forEach((radio) => {
        radio.removeEventListener('click', stop)
        radio.removeEventListener('change', stop)
      })
    }
  }, [sectionId])

  return null
}
