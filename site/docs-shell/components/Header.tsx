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
    let currentAtTop = lastScrollTop <= 10
    let scrollDirection = 0
    let revision = 0
    let activeTransition: ViewTransition | null = null

    // Restored scroll positions use their final state without an entrance animation.
    setAtTop(currentAtTop)

    const changeAtTop = (next: boolean) => {
      currentAtTop = next
      const request = ++revision
      activeTransition?.skipTransition()
      if (!transitionAtTop || !document.startViewTransition || motion.matches) {
        setAtTop(next)
        return
      }
      root.classList.add('app-header-transition')
      const transition = document.startViewTransition(() => {
        // A skipped transition still calls its update; only the latest request may commit.
        if (request === revision) flushSync(() => setAtTop(next))
      })
      activeTransition = transition
      void transition.ready.catch(() => {})
      const finish = () => {
        if (activeTransition !== transition) return
        activeTransition = null
        root.classList.remove('app-header-transition')
      }
      void transition.finished.then(finish, finish)
    }

    const reduceMotion = () => { if (motion.matches) activeTransition?.skipTransition() }
    const handleScroll = throttle(
      50,
      () => {
        const st = Math.max(0, window.scrollY)
        const nextAtTop = st <= 10
        if (nextAtTop) {
          scrollDirection = -1
          navbar.style.transform = ''
        }
        if (nextAtTop !== currentAtTop) changeAtTop(nextAtTop)
        if (Math.abs(st - lastScrollTop) <= 100) return
        const direction = st > lastScrollTop ? 1 : -1
        if (direction !== scrollDirection) {
          scrollDirection = direction
          navbar.style.transform = direction === 1 && !nextAtTop ? 'translateY(-100%)' : ''
        }
        lastScrollTop = st
      },
    )
    motion.addEventListener('change', reduceMotion)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      revision++
      handleScroll.cancel()
      window.removeEventListener('scroll', handleScroll)
      motion.removeEventListener('change', reduceMotion)
      activeTransition?.skipTransition()
      if (transitionAtTop) root.classList.remove('app-header-transition')
    }
  }, [top, stickable, transitionAtTop])

  return (
    <nav ref={ref} aria-label={props['aria-label']}
      className={clsx('z-index:1040 width:100% padding-top:env(safe-area-inset-top) white-space:nowrap contain:layout|style bb-line-subtle:not(.at-top) border-bottom-style:solid:not(.at-top) border-bottom-width:1px:not(.at-top) bg-surface-base/.9:not(.at-top) backdrop-filter:blur(25px):not(.at-top) display:none@media(print) app-wrapper',
        'app-header',
        props.className,
        {
          'transition-duration:.2s transition-property:transform,height,padding,backdrop-filter,background-color': stickable,
          'position:fixed top:0': fixed,
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
