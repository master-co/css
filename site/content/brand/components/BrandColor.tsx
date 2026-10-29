'use client'

import { useEffect, useRef, useState } from 'react'
import DemoCopyButton from '~/site/components/demo/DemoCopyButton'
import { useThemeMode } from '~/site/docs-shell/contexts/theme-mode'
import { brandRoleOrigins } from '~/site/common/brand'

export interface BrandColorProps {
  title: string
  token: string
  value?: string
  description?: string
  family?: string
}

/** A computed swatch reading is browser paint evidence, not a replacement token definition. */
export default function BrandColor({ title, token, value, description, family }: BrandColorProps) {
  const swatch = useRef<HTMLSpanElement>(null)
  const [computed, setComputed] = useState('')
  const { value: mode } = useThemeMode()
  const origin = brandRoleOrigins[token as keyof typeof brandRoleOrigins]
  useEffect(() => {
    const element = swatch.current
    if (!element) return
    const sample = element.firstElementChild
    const style = getComputedStyle(sample && family ? sample : element)
    setComputed(family === 'text' ? style.color : family === 'line' ? style.borderTopColor : style.backgroundColor)
  }, [mode, token, family])

  return <div className="brand-color" data-family={family} data-token={token}>
    <span ref={swatch} className="brand-color-paint" aria-hidden="true">{family === 'text' && <span style={{ color: `var(${token})` }}>Aa</span>}{family === 'line' && <span style={{ borderColor: `var(${token})` }} />}</span>
    <div className="brand-color-info"><strong>{title}{origin && <small className="brand-role-origin">{origin}</small>}</strong><code>{token}</code><span className="brand-color-value">{value || computed || 'Adapts to the theme'}</span>{description && <p>{description}</p>}</div>
    <DemoCopyButton value={`var(${token})`} label={`Copy var(${token})`} feedback="compact" className="brand-copy">Copy variable</DemoCopyButton>
  </div>
}
