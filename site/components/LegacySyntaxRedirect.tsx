'use client'

import { useEffect } from 'react'
import { legacySyntaxDestination, type LegacySyntaxSlug } from '../utils/legacy-syntax'

export default function LegacySyntaxRedirect({ slug, locale }: { slug: LegacySyntaxSlug; locale: string }) {
  useEffect(() => {
    window.location.replace(legacySyntaxDestination(slug, window.location.hash, window.location.pathname.startsWith(`/${locale}/`) ? locale : ''))
  }, [slug, locale])
  return null
}
