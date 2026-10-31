'use client'

import '~/site/styles/docs-shell/wrapper.css'
import { throttle } from 'throttle-debounce'
import { useLayoutEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import clsx from 'clsx'

export default function Header({ top, stickable, fixed = true, transitionAtTop = false, ...props }: any) {
  const ref = useRef<HTMLElement>(null)
  const [atTop, setAtTop] = useState(!!stickable)

  useLayoutEffect(() => {
    if (!stickable || top) return
    const navbar = ref.current!
    const root = document.documentElement
    const motion = matchMedia('(prefers-reduced-motion: reduce)')
    let lastScrollTop = window.scrollY
    let scrollDirection = 0
    let activeTransition: ViewTransition | null = null
    // What the header should show now; each change applies all of it, so a skipped transition loses nothing.
    const desired = { atTop: lastScrollTop <= 10, tucked: false }

    // Restored scroll positions use their final state without an entrance animation.
    setAtTop(desired.atTop)

    const apply = () => {
      navbar.style.transform = desired.tucked ? 'translateY(-100%)' : ''
      flushSync(() => setAtTop(desired.atTop))
    }

    // With `transitionAtTop`, every change of the header runs as a view transition of the header alone. The marker
    // is a data attribute, not a class, so canvases watching the root's class for theme changes stay still.
    const change = (kind: 'top' | 'tuck') => {
      activeTransition?.skipTransition()
      if (!transitionAtTop || !document.startViewTransition || motion.matches) {
        apply()
        return
      }
      root.dataset.headerTransition = kind
      const transition = document.startViewTransition(apply)
      activeTransition = transition
      void transition.ready.catch(() => {})
      const finish = () => {
        if (activeTransition !== transition) return
        activeTransition = null
        delete root.dataset.headerTransition
      }
      void transition.finished.then(finish, finish)
    }

    const reduceMotion = () => { if (motion.matches) activeTransition?.skipTransition() }
    const handleScroll = throttle(
      50,
      () => {
        const st = Math.max(0, window.scrollY)
        const nextAtTop = st <= 10
        let kind: 'top' | 'tuck' | undefined
        if (nextAtTop) {
          scrollDirection = -1
          if (desired.tucked) {
            desired.tucked = false
            kind = 'tuck'
          }
        }
        if (nextAtTop !== desired.atTop) {
          desired.atTop = nextAtTop
          kind = 'top'
        }
        if (Math.abs(st - lastScrollTop) > 100) {
          const direction = st > lastScrollTop ? 1 : -1
          if (direction !== scrollDirection) {
            scrollDirection = direction
            const tucked = direction === 1 && !nextAtTop
            if (tucked !== desired.tucked) {
              desired.tucked = tucked
              kind ??= 'tuck'
            }
          }
          lastScrollTop = st
        }
        if (kind) change(kind)
      },
    )
    motion.addEventListener('change', reduceMotion)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      handleScroll.cancel()
      window.removeEventListener('scroll', handleScroll)
      motion.removeEventListener('change', reduceMotion)
      activeTransition?.skipTransition()
      if (transitionAtTop) delete root.dataset.headerTransition
    }
  }, [top, stickable, transitionAtTop])

  return (
    <nav ref={ref} aria-label={props['aria-label']}
      className={clsx('(z-index:1040) (width:100%) (padding-top:env(safe-area-inset-top)) (white-space:nowrap) (contain:layout|style) bb-line-subtle:not(.at-top) (border-bottom-style:solid):not(.at-top) (border-bottom-width:1px):not(.at-top) bg-surface-base/.9:not(.at-top) (backdrop-filter:blur(25px)):not(.at-top) hidden@media(print) app-wrapper',
        'app-header',
        props.className,
        {
          '(transition-duration:.2s) (transition-property:transform,height,padding,backdrop-filter,background-color)': stickable && !transitionAtTop,
          'fixed (top:0)': fixed,
          'at-top': atTop
        }
      )}
      style={{
        willChange: 'transform, height, padding, backdrop-filter, background-color',
      }}
    >
      {props.children}
    </nav>
  )
}
