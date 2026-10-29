import { useRef, useMemo, useCallback, MouseEventHandler, useLayoutEffect } from 'react'
import clsx from 'clsx'
import { anchor } from '../utils/anchor'
import { usePathname } from '../layouts/root'
import { useI18n } from '../contexts/i18n'
import { useLocale } from '../contexts/locale'
import { canonicalizeDefaultLocalePathname, localizePathname } from '../utils/i18n-pathname'

const initializedScrollPositionParent = new Set()

/**
 * A localized anchor. It renders statically; inside a client island it also keeps
 * active links scrolled into view. Same-page hash links scroll through `docs-shell/scripts/anchors`.
 */
function Link({ children, className, activeClassName = '', inactiveClassName = '', ambiguous, scrollIntoView, unfinished, active, indicate, ref, ...props }: any) {
  const i18n = useI18n()
  const locale = useLocale()
  const pathname = usePathname()
  const isHash = props.href?.startsWith('#')
  const external = props.href?.startsWith('http')
  const linkRef = useRef<HTMLAnchorElement | HTMLButtonElement>(null)
  const href = useMemo(() => {
    if (!props.href?.startsWith('/')) return props.href || ''
    return localizePathname(props.href, {
      defaultLocale: i18n.defaultLocale,
      locale,
      locales: i18n.locales,
      localizablePathnameRoots: i18n.localizablePathnameRoots
    }) || ''
  }, [props.href, i18n.defaultLocale, i18n.locales, i18n.localizablePathnameRoots, locale])

  const canonicalHref = useMemo(() => canonicalizeDefaultLocalePathname(href, i18n.defaultLocale), [href, i18n.defaultLocale])

  const onClick = useCallback<MouseEventHandler>((event) => {
    if (isHash) {
      event.preventDefault()
      anchor(href.slice(1), { offset: 110 })
    }
    if (props.disabled) {
      event.preventDefault()
    }
    props.onClick?.(event)
  }, [href, isHash, props])

  const pathnameActive = useMemo(() => {
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
  }, [active, href, canonicalHref, ambiguous, pathname])

  useLayoutEffect(() => {
    const currentLink = linkRef.current
    if (currentLink && pathnameActive && scrollIntoView) {
      const scrollableParent: HTMLElement = getScrollParent(currentLink)
      if (scrollableParent) {
        const scrollableParentRect = scrollableParent.getBoundingClientRect()
        const targetRect = currentLink.getBoundingClientRect()
        scrollableParent.scrollTo({
          top: currentLink.offsetTop + targetRect.height - scrollableParentRect.height / 2,
          behavior: initializedScrollPositionParent.has(scrollableParent) ? 'smooth' : 'instant' as ScrollBehavior
        })
        initializedScrollPositionParent.add(scrollableParent)
      }
    }
  }, [pathnameActive, scrollIntoView])

  const handleRef = useCallback((newRef: HTMLButtonElement | HTMLAnchorElement | null) => {
    linkRef.current = newRef
    if (typeof ref === 'function') {
      ref(newRef)
    } else if (ref) {
      ref.current = newRef
    }
  }, [ref])

  const resolvedClassName = clsx(className, {
    'font-size:50%:after line-height:0:after text-wrap-mode:wrap:after vertical-align:super:after white-space-collapse:break-spaces:after': indicate && (external || isHash),
    'content:var(--content-hash):after': indicate && isHash,
    'content:var(--content-external):after': indicate && external,
    'fg-text-disabled': props.disabled
  }, !props.disabled && (pathnameActive ? activeClassName : inactiveClassName).trim()) || undefined

  return (props.href && !props.disabled)
    ? <a ref={handleRef} {...props} href={href} rel={external ? 'noreferrer noopener' : props.rel} target={external ? '_blank' : props.target} onClick={onClick}
      className={resolvedClassName}>
      {children}{unfinished && <span className='ml-2xs font-size:.5em'>🚧</span>}
    </a>
    : <button ref={handleRef} {...props} onClick={onClick}
      className={resolvedClassName}>
      {children}{unfinished && <span className='ml-2xs font-size:.5em'>🚧</span>}
    </button>
}

export default Link

function getScrollParent(element: any) {
  var style = getComputedStyle(element)
  var excludeStaticParent = style.position === 'absolute'
  var overflowRegex = /(auto|scroll|overlay)/

  if (style.position === 'fixed') return document.body
  for (var parent = element; (parent = parent.parentElement);) {
    style = getComputedStyle(parent)
    if (excludeStaticParent && style.position === 'static') {
      continue
    }
    if (overflowRegex.test(style.overflow + style.overflowY + style.overflowX)) return parent
  }

  return document.body
}
