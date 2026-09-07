'use client'

import { useEffect, useState } from 'react'
import { IconArrowRight, type IconBook } from '@tabler/icons-react'
import Link from 'internal/components/Link'
import { useLocale } from 'internal/contexts/locale'
import { useTranslation } from 'internal/contexts/i18n'

export interface DocumentationIndexEntry {
  id: string
  title: string
  displayTitle?: string
  description?: string
  category: string
  url: string
  disabled?: boolean
  unfinished?: boolean
}

export interface DocumentationIndexSection {
  id: string
  title: string
  description: string
  Icon: typeof IconBook
  groups: { title?: string; entries: DocumentationIndexEntry[] }[]
}

interface SectionLink {
  title: string
  description: string
  Icon: typeof IconBook
  href: string
}

export default function DocumentationIndex({ name, sections, related, showDescriptions = false }: {
  name: 'guide' | 'reference'
  sections: DocumentationIndexSection[]
  related: SectionLink
  showDescriptions?: boolean
}) {
  const [alphabetical, setAlphabetical] = useState(false)
  const tw = useLocale() === 'tw'
  const entries = sections.flatMap(section => section.groups.flatMap(group => group.entries))
  const letters = Map.groupBy([...entries].sort((a, b) => a.title.localeCompare(b.title)), entry => /^[a-z]/i.test(entry.title) ? entry.title[0].toUpperCase() : '#')
  const sectionIds = sections.map(section => section.id).join(',')

  useEffect(() => {
    function syncView() {
      if (/^#index-(symbols|[a-z])$/.test(location.hash)) setAlphabetical(true)
      else if (sectionIds.split(',').includes(location.hash.slice(1))) setAlphabetical(false)
    }
    syncView()
    window.addEventListener('hashchange', syncView)
    return () => window.removeEventListener('hashchange', syncView)
  }, [sectionIds])
  useEffect(() => {
    const target = document.getElementById(location.hash.slice(1))
    if (target && !target.closest('[hidden]')) target.scrollIntoView({ block: 'start' })
  }, [alphabetical])

  return <div className={`doc-index${showDescriptions ? ' doc-index-guides' : ''}`}>
    <nav className="doc-index-sections" aria-label={tw ? `${name === 'guide' ? 'Guide' : 'Reference'} 分區` : `${name === 'guide' ? 'Guide' : 'Reference'} sections`}>
      {sections.map(section => <SectionLink key={section.id} {...section} href={`#${section.id}`} onClick={() => setAlphabetical(false)} />)}
      <SectionLink {...related} />
    </nav>

    <div className="doc-index-toolbar">
      <span>{tw ? (name === 'guide' ? '教學索引' : '所有條目') : (name === 'guide' ? 'Browse guides' : 'All entries')} <span className="doc-index-count">{entries.length}</span></span>
      <div className="doc-index-view" role="group" aria-label={tw ? '索引顯示方式' : 'Index view'}>
        <button aria-pressed={!alphabetical} aria-controls={`${name}-category-index`} onClick={() => setAlphabetical(false)}>{tw ? '依分類' : 'By category'}</button>
        <button aria-pressed={alphabetical} aria-controls={`${name}-alphabetical-index`} onClick={() => setAlphabetical(true)}>A–Z</button>
      </div>
    </div>

    <div id={`${name}-category-index`} hidden={alphabetical}>
      {sections.map(section => <section key={section.id} className="doc-index-section" aria-labelledby={section.id}>
        <header className="doc-index-heading">
          <h2 id={section.id}>{section.title} <span className="doc-index-count">{section.groups.reduce((total, group) => total + group.entries.length, 0)}</span></h2>
          <p>{section.description}</p>
        </header>
        {section.groups.length === 1
          ? <EntryLinks entries={section.groups[0].entries} columns showDescriptions={showDescriptions} />
          : <div className="doc-index-categories">{section.groups.map(group => <section key={group.title} className="doc-index-category">
            <h3>{group.title} <span className="doc-index-count">{group.entries.length}</span></h3>
            <EntryLinks entries={group.entries} />
          </section>)}</div>}
      </section>)}
    </div>

    <div id={`${name}-alphabetical-index`} hidden={!alphabetical}>
      <nav className="doc-index-letters" aria-label={tw ? '依字母跳轉' : 'Jump to a letter'}>
        {[...letters.keys()].map(letter => <a key={letter} href={`#index-${letter === '#' ? 'symbols' : letter.toLowerCase()}`}>{letter}</a>)}
      </nav>
      {[...letters].map(([letter, documents]) => <section key={letter} className="doc-index-letter-group">
        <h2 id={`index-${letter === '#' ? 'symbols' : letter.toLowerCase()}`}>{letter}</h2>
        <EntryLinks entries={documents} columns showCategory />
      </section>)}
    </div>
  </div>
}

function SectionLink({ href, title, description, Icon, onClick }: SectionLink & { onClick?: () => void }) {
  const Anchor = href.startsWith('#') ? 'a' : Link
  return <Anchor href={href} className="doc-index-section-link" onClick={onClick}>
    <span className="doc-index-section-icon"><Icon size={21} stroke={1.4} aria-hidden="true" /></span>
    <span className="doc-index-section-copy">
      <span className="doc-index-section-title">{title}</span>
      <span className="doc-index-section-description">{description}</span>
    </span>
    <IconArrowRight size={16} stroke={1.5} aria-hidden="true" />
  </Anchor>
}

function EntryLinks({ entries, columns, showCategory, showDescriptions }: { entries: DocumentationIndexEntry[]; columns?: boolean; showCategory?: boolean; showDescriptions?: boolean }) {
  const $ = useTranslation()
  return <ul className={`doc-index-links${columns ? ' doc-index-links-columns' : ''}${showDescriptions ? ' doc-index-links-descriptions' : ''}`}>
    {entries.map(entry => <li key={entry.id}>
      <Link href={entry.url} disabled={entry.disabled} unfinished={entry.unfinished}>
        <span>
          <span className="doc-index-entry-title">{entry.displayTitle || entry.title}</span>
          {showCategory && <small>{$(entry.category)}</small>}
          {showDescriptions && entry.description && <span className="doc-index-entry-description">{$(entry.description)}</span>}
        </span>
        <IconArrowRight size={14} stroke={1.5} aria-hidden="true" />
      </Link>
    </li>)}
  </ul>
}
