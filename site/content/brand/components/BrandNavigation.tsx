'use client'

import { useEffect, useRef, useState } from 'react'
import { IconChevronDown } from '@tabler/icons-react'
import { brandSections } from '~/site/common/brand'
import { useLocale } from '~/site/docs-shell/contexts/locale'

export default function BrandNavigation() {
  const tw = useLocale() === 'tw'
  const [active, setActive] = useState<string>('identity')
  const details = useRef<HTMLDetailsElement>(null)

  useEffect(() => {
    const headings = brandSections.flatMap(section => {
      const heading = document.getElementById(section.id)
      return heading ? [heading] : []
    })
    const update = () => {
      const top = innerWidth < 1024 ? 130 : 160
      const current = headings.filter(heading => heading.getBoundingClientRect().top <= top).at(-1)
      setActive(current?.id ?? 'identity')
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update, { passive: true })
    return () => { window.removeEventListener('scroll', update); window.removeEventListener('resize', update) }
  }, [])

  const links = <ol>{brandSections.map(section => <li key={section.id}>
    <a href={`#${section.id}`} aria-current={active === section.id ? 'location' : undefined} onClick={() => { if (details.current) details.current.open = false }}>
      <span aria-hidden="true">{section.number}</span>{tw ? section.titleTW : section.title}
    </a>
  </li>)}</ol>

  return <aside className="brand-navigation">
    <nav className="brand-desktop-navigation" aria-label={tw ? '品牌指南章節' : 'Brand guide sections'}>
      <p className="brand-overline">{tw ? '品牌指南' : 'The brand guide'}</p>{links}
      <a className="brand-handbook-link" href={tw ? '/tw/design-system' : '/design-system'}>{tw ? '元件與實作手冊' : 'Components & authoring'}<span aria-hidden="true">↗</span></a>
    </nav>
    <details ref={details} className="brand-mobile-navigation">
      <summary>{tw ? '本頁章節' : 'Explore the guide'}<IconChevronDown size={16} aria-hidden="true" /></summary>
      <nav aria-label={tw ? '品牌指南章節' : 'Brand guide sections'}>{links}</nav>
    </details>
  </aside>
}
