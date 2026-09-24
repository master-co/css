'use client'

import { useRef, useMemo, useCallback, MouseEventHandler, useContext, useLayoutEffect } from 'react'
import clsx from 'clsx'
import NextLink from 'next/link'
import { anchor } from '../utils/anchor'
import RedirectsContext from '../contexts/redirects'
import useRewritedPathname from '../uses/rewrited-pathname'
import { useI18n } from '../contexts/i18n'
import { useLocale } from '../contexts/locale'
import { canonicalizeDefaultLocalePathname, localizePathname } from '../utils/i18n-pathname'

const initializedScrollPositionParent = new Set()

function Link({ children, className, activeClassName = '', inactiveClassName = '', ambiguous, scrollIntoView, unfinished, noResolveRedirect, active, scroll, indicate, ref, ...props }: any) {
  const redirects = useContext(RedirectsContext)
  const i18n = useI18n()
  const locale = useLocale()
  const pathname = useRewritedPathname()
  const isHash = useMemo(() => props.href?.startsWith('#'), [props.href])
  const rel = useRef(props.rel)
  const target = useRef(props.target)
  const linkRef = useRef<HTMLAnchorElement | HTMLButtonElement>(null)
  const href = useMemo(() => {
    if (props.href?.startsWith('#')) {
      return props.href || ''
    }
    if (props.href?.startsWith('http')) {
      rel.current = 'noreferrer noopener'
      target.current = '_blank'
      return props.href || ''
    }
    if (!props.href?.startsWith('/')) {
      return props.href || ''
    }
    let resolvedHref = props.href
    if (!noResolveRedirect)
      if (redirects && props.href) {
        for (const eachRedirect of redirects) {
          if (props.href === eachRedirect.source) {
            resolvedHref = eachRedirect.destination
            break
          }
        }
      }
    return localizePathname(resolvedHref, {
      defaultLocale: i18n.defaultLocale,
      locale,
      locales: i18n.locales,
      localePrefixMode: i18n.localePrefixMode,
      localizablePathnameRoots: i18n.localizablePathnameRoots
    }) || ''
  }, [props.href, noResolveRedirect, redirects, i18n.defaultLocale, i18n.locales, i18n.localePrefixMode, i18n.localizablePathnameRoots, locale])

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
      let matched = true
      hrefSplits.forEach((eachHrefSplit: string, i: number) => {
        const eachPathnameSplit = pathnameSplits?.[i]
        if (eachHrefSplit !== eachPathnameSplit)
          matched = false
      })
      return matched
    } else if (pathname === canonicalHref) {
      return true
    }
    return false
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

  const resolvedClassName = useMemo(() => clsx(className, {
    '{font-size:50%;leading:0;vertical-align:super;white-space:break-spaces}:after': indicate && (target.current === '_blank' || isHash),
    'content-hash:after': indicate && isHash,
    'content-external:after': indicate && target.current === '_blank',
    'text-disabled': props.disabled
  }, !props.disabled && (pathnameActive ? activeClassName : inactiveClassName).trim()) || undefined,
    [className, indicate, isHash, props.disabled, pathnameActive, activeClassName, inactiveClassName])

  return (props.href && !props.disabled)
    ? <NextLink ref={handleRef} {...props} scroll={scroll} href={href} rel={rel.current} target={target.current} onClick={onClick}
      className={resolvedClassName}>
      {children}{unfinished && <span className='ml-2xs font-size:.5em'>🚧</span>}
    </NextLink>
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
