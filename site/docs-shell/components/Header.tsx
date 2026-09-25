'use client'

import '~/site/styles/docs-shell/wrapper.css'
import { throttle } from 'throttle-debounce'
import { useLayoutEffect, useRef, useState } from 'react'
import { isBrowser } from '../utils/isBrowser'
import clsx from 'clsx'

export default function Header({ top, stickable, fixed = true, ...props }: any) {
  const initialScrollTop = isBrowser ? window.pageYOffset || document.documentElement.scrollTop : 0
  const ref = useRef<any>(undefined)
  let lastScrollTop = initialScrollTop
  const scrollDirectionRef = useRef(0)
  const [atTop, setAtTop] = useState(stickable ? true : false)

  useLayoutEffect(() => {
    if (!stickable || top) return
    const handleScroll = throttle(
      50,
      () => {
        const navbar: HTMLElement = ref.current
        if (navbar) {
          const { current: scrollDirection } = scrollDirectionRef
          let st = window.pageYOffset || document.documentElement.scrollTop
          if (st <= 10) {
            if (!atTop) {
              setAtTop(true)
            }
          } else {
            if (atTop) {
              setAtTop(false)
            }
          }
          if (Math.abs(st - lastScrollTop) <= 100) {
            return
          }
          if (st > lastScrollTop) {
            // downscroll code
            if (scrollDirection !== 1) {
              scrollDirectionRef.current = 1
              navbar.style.transform = 'translateY(-100%)'
            }
          } else {
            if (scrollDirection !== -1) {
              // upscroll code
              scrollDirectionRef.current = -1
              navbar.style.transform = ''
            }
          }
          // eslint-disable-next-line react-hooks/exhaustive-deps
          lastScrollTop = st <= 0 ? 0 : st // For Mobile or negative scrolling
        }
      },
    )
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [top, atTop, stickable])

  return (
    <nav ref={ref}
      className={clsx('z:1040 w:100% white-space:nowrap contain:layout|style bb:1px|solid|var(--color-line-subtle):not(.at-top) bg-surface-base/.9:not(.at-top) backdrop-filter:blur(25px):not(.at-top) hidden@print app-wrapper pt:env(safe-area-inset-top)',
        props.className,
        {
          'transition:transform|.2s,height|.2s,padding|.2s,backdrop-filter|.2s,background-color|.2s': stickable,
          'fixed top': fixed,
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
