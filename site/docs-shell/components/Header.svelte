<script lang="ts" module>
  import type { Snippet } from 'svelte'

  export interface HeaderProps {
    /** Overlays the page, slides away while reading down and is transparent at the top (homepage, blog). */
    stickable?: boolean
    /** With `stickable`, each change of the header runs as a view transition of the header alone. */
    transitionAtTop?: boolean
    class?: string
    children?: Snippet
  }
</script>

<script lang="ts">
  import '~/site/styles/docs-shell/header.css'
  import { throttle } from 'throttle-debounce'
  import { flushSync } from 'svelte'
  import clsx from 'clsx'

  /**
   * The site header. By default it sticks to the top of the canvas; a stickable header overlays the page instead.
   * Its state is on data attributes: `data-background="transparent"` at the top of the page, `data-tucked` while hidden.
   */
  let { stickable, transitionAtTop = false, class: className, children }: HeaderProps = $props()
  let header = $state<HTMLElement>()
  // Mirrors the server render: a stickable header starts transparent at the top.
  // svelte-ignore state_referenced_locally
  let atTop = $state(!!stickable)

  $effect(() => {
    if (!stickable || !header) return
    const element = header
    const transitionAtTopEnabled = transitionAtTop
    const root = document.documentElement
    const motion = matchMedia('(prefers-reduced-motion: reduce)')
    let lastScrollTop = window.scrollY
    let scrollDirection = 0
    let activeTransition: ViewTransition | null = null
    // What the header should show now; each change applies all of it, so a skipped transition loses nothing.
    const desired = { atTop: lastScrollTop <= 10, tucked: false }

    // Restored scroll positions use their final state without an entrance animation.
    atTop = desired.atTop

    const apply = () => {
      element.toggleAttribute('data-tucked', desired.tucked)
      flushSync(() => { atTop = desired.atTop })
    }

    // With `transitionAtTop`, every change of the header runs as a view transition of the header alone. The marker
    // is a data attribute, not a class, so canvases watching the root's class for theme changes stay still.
    const change = (kind: 'top' | 'tuck') => {
      activeTransition?.skipTransition()
      if (!transitionAtTopEnabled || !document.startViewTransition || motion.matches) {
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
      if (transitionAtTopEnabled) delete root.dataset.headerTransition
    }
  })
</script>

<!-- A view transition animates the header itself; a CSS transition would run again after it. -->
<header bind:this={header} class={clsx('ui-header', className)}
  data-variant={stickable ? 'stickable' : undefined}
  data-background={stickable && atTop ? 'transparent' : undefined}
  style={transitionAtTop ? 'transition: none' : undefined}>
  {@render children?.()}
</header>
