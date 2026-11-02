<script lang="ts" module>
  const initializedScrollPositionParent = new Set<HTMLElement>()

  function getScrollParent(element: HTMLElement) {
    let style = getComputedStyle(element)
    const excludeStaticParent = style.position === 'absolute'
    const overflowRegex = /(auto|scroll|overlay)/

    if (style.position === 'fixed') return document.body
    for (let parent: HTMLElement | null = element; (parent = parent.parentElement);) {
      style = getComputedStyle(parent)
      if (excludeStaticParent && style.position === 'static') {
        continue
      }
      if (overflowRegex.test(style.overflow + style.overflowY + style.overflowX)) return parent
    }

    return document.body
  }
</script>

<script lang="ts">
  import type { Snippet } from 'svelte'
  import clsx from 'clsx'
  import { anchor } from '../utils/anchor'
  import { getSite } from '../site'
  import { canonicalizeDefaultLocalePathname, localizePathname } from '../utils/i18n-pathname'

  interface Props {
    href?: string
    class?: any
    /** Active anywhere inside the linked section rather than only on the page itself. */
    ambiguous?: boolean
    /** Keep the active link scrolled into view in its scrolling container. */
    scrollIntoView?: boolean
    unfinished?: boolean
    active?: boolean
    /** Mark external and same-page links after the text; see `styles/docs-shell/prose.css`. */
    indicate?: boolean
    /** The `aria-current` token for an active link that is not the page itself, such as `true`. */
    current?: string
    disabled?: boolean
    onclick?: (event: MouseEvent) => void
    element?: HTMLAnchorElement | HTMLButtonElement
    children?: Snippet
    [key: string]: any
  }

  /**
   * A localized anchor. It renders statically; when hydrated it also keeps active links scrolled into view.
   * Same-page hash links scroll through `docs-shell/scripts/document`. A link to the page being read carries
   * `aria-current="page"`; with `current`, a link that is only active (inside its section, see `ambiguous`) carries
   * that token instead, such as `true`.
   */
  let { children, class: className, ambiguous, scrollIntoView, unfinished, active, indicate, current, element = $bindable(), onclick, ...props }: Props = $props()

  const { i18n, locale, pathname } = getSite()
  const isHash = $derived(props.href?.startsWith('#'))
  const external = $derived(props.href?.startsWith('http'))
  const href: string = $derived.by(() => {
    if (!props.href?.startsWith('/')) return props.href || ''
    return localizePathname(props.href, {
      defaultLocale: i18n.defaultLocale,
      locale,
      locales: i18n.locales,
      localizablePathnameRoots: i18n.localizablePathnameRoots
    }) || ''
  })
  const canonicalHref = $derived(canonicalizeDefaultLocalePathname(href, i18n.defaultLocale))

  function handleClick(event: MouseEvent) {
    if (isHash && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
      event.preventDefault()
      anchor(href.slice(1), { offset: 110 })
    }
    if (props.disabled) {
      event.preventDefault()
    }
    onclick?.(event)
  }

  const pathnameActive = $derived.by(() => {
    if (active !== undefined) {
      return active
    } else if (href.startsWith('http')) {
      return false
    } else if (ambiguous) {
      const pathnameSplits = pathname?.split('/')
      const hrefSplits = canonicalHref.split('/')
      return hrefSplits.every((eachHrefSplit: string, i: number) => eachHrefSplit === pathnameSplits?.[i])
    }
    return pathname === canonicalHref
  })

  // A link to the page being read says so; section-level (ambiguous) matches only change its styling.
  const currentPage = $derived(!isHash && !external && pathname === canonicalHref)

  $effect.pre(() => {
    const currentLink = element
    if (currentLink && pathnameActive && scrollIntoView) {
      const scrollableParent = getScrollParent(currentLink)
      if (scrollableParent) {
        const scrollableParentRect = scrollableParent.getBoundingClientRect()
        const targetRect = currentLink.getBoundingClientRect()
        scrollableParent.scrollTo({
          top: currentLink.offsetTop + targetRect.height - scrollableParentRect.height / 2,
          behavior: initializedScrollPositionParent.has(scrollableParent) && !matchMedia('(prefers-reduced-motion: reduce)').matches ? 'smooth' : 'instant' as ScrollBehavior
        })
        initializedScrollPositionParent.add(scrollableParent)
      }
    }
  })

  const resolvedClassName = $derived(clsx(className, {
    'fg-text-disabled': props.disabled
  }) || undefined)
  // The mark after an indicated link is drawn by styles/docs-shell/prose.css.
  const indication = $derived(indicate ? external ? 'external' : isHash ? 'hash' : undefined : undefined)
</script>

{#if props.href && !props.disabled}
  <a bind:this={element} {...props} data-indicate={indication} {href} aria-current={props['aria-current'] ?? (currentPage ? 'page' : current && pathnameActive ? current : undefined)} rel={external ? 'noreferrer noopener' : props.rel} target={external ? '_blank' : props.target} onclick={handleClick}
    class={resolvedClassName}>{@render children?.()}{#if unfinished}<span class="ml-2xs (font-size:.5em)">🚧</span>{/if}</a>
{:else}
  <button bind:this={element} {...props} onclick={handleClick}
    class={resolvedClassName}>{@render children?.()}{#if unfinished}<span class="ml-2xs (font-size:.5em)">🚧</span>{/if}</button>
{/if}
