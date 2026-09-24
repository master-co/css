'use client'

import { useI18n } from '../contexts/i18n'
import { usePathname } from 'next/navigation'
import { canonicalizeDefaultLocalePathname } from '../utils/i18n-pathname'

export default function useRewritedPathname() {
  const pathname = usePathname()
  const i18n = useI18n()
  return pathname ? canonicalizeDefaultLocalePathname(pathname, i18n.defaultLocale) : pathname
}
