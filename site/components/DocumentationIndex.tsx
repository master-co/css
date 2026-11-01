'use client'

import '~/site/styles/documentation-index.css'
import { useEffect, useState } from 'react'
import Link from '~/site/docs-shell/components/Link'
import { useLocale } from '~/site/docs-shell/contexts/locale'
import { useTranslation } from '~/site/docs-shell/contexts/i18n'

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
  groups: { id?: string; title?: string; entries: DocumentationIndexEntry[] }[]
}

interface SectionLink {
  title: string
  description: string
  href: string
}

export default function DocumentationIndex({ name, sections, related, showDescriptions = false, idPrefix }: {
  name: 'guide' | 'reference'
  sections: DocumentationIndexSection[]
  related: SectionLink
  showDescriptions?: boolean
  /** Scope anchor IDs when multiple catalogs are shown in one review. Omit on published indexes. */
  idPrefix?: string
}) {
  const [alphabetical, setAlphabetical] = useState(false)
  const tw = useLocale() === 'tw'
  const entries = sections.flatMap(section => section.groups.flatMap(group => group.entries))
  const letters = Map.groupBy([...entries].sort((a, b) => a.title.localeCompare(b.title)), entry => /^[a-z]/i.test(entry.title) ? entry.title[0].toUpperCase() : '#')
  const groupId = (section: DocumentationIndexSection, index: number) => section.groups[index].id ?? `${section.id}-group-${index + 1}`
  const sectionIds = sections.flatMap(section => [section.id, ...section.groups.map((_, index) => groupId(section, index))]).join(',')
  const panelId = (part: 'category' | 'alphabetical') => `${idPrefix ?? name}-${part}-index`
  const letterId = (letter: string) => `${idPrefix ? `${idPrefix}-` : ''}index-${letter === '#' ? 'symbols' : letter.toLowerCase()}`
  const letterHashPrefix = `#${idPrefix ? `${idPrefix}-` : ''}index-`
  const count = (section: DocumentationIndexSection) => section.groups.reduce((total, group) => total + group.entries.length, 0)
  const ordinal = (index: number) => String(index + 1).padStart(2, '0')

  useEffect(() => {
    function syncView() {
      if (location.hash.startsWith(letterHashPrefix) && /^(symbols|[a-z])$/.test(location.hash.slice(letterHashPrefix.length))) setAlphabetical(true)
      else if (sectionIds.split(',').includes(location.hash.slice(1))) setAlphabetical(false)
    }
    syncView()
    window.addEventListener('hashchange', syncView)
    return () => window.removeEventListener('hashchange', syncView)
  }, [letterHashPrefix, sectionIds])
  useEffect(() => {
    const target = document.getElementById(location.hash.slice(1))
    if (target && !target.closest('[hidden]')) target.scrollIntoView({ block: 'start' })
  }, [alphabetical])

  return <div className="documentation-index">
    {/* A contents list, not a second catalog: each section by its number, name and size; the sibling index closes it. */}
    <nav className="documentation-index-directory" aria-label={tw ? `${name === 'guide' ? 'Guide' : 'Reference'} 分區` : `${name === 'guide' ? 'Guide' : 'Reference'} sections`}>
      {sections.map((section, index) => <a key={section.id} href={`#${section.id}`} onClick={() => setAlphabetical(false)}>
        <small>{ordinal(index)}</small>
        <b>{section.title}</b>
        <span className="documentation-index-count">{count(section)}</span>
      </a>)}
      <Link href={related.href} data-related="">
        <small aria-hidden="true">→</small>
        <b>{related.title}</b>
        <span>{related.description}</span>
      </Link>
    </nav>

    <div className="documentation-index-toolbar">
      <p>{tw ? (name === 'guide' ? '所有教學' : '所有條目') : (name === 'guide' ? 'All guides' : 'All entries')} <span className="documentation-index-count">{entries.length}</span></p>
      <div className="ui-segmented" data-variant="underline" role="group" aria-label={tw ? '索引顯示方式' : 'Index view'}>
        <button type="button" aria-pressed={!alphabetical} aria-controls={panelId('category')} onClick={() => setAlphabetical(false)}>{tw ? '依分類' : 'By category'}</button>
        <button type="button" aria-pressed={alphabetical} aria-controls={panelId('alphabetical')} onClick={() => setAlphabetical(true)}>A–Z</button>
      </div>
    </div>

    <div id={panelId('category')} hidden={alphabetical}>
      {sections.map((section, sectionIndex) => <section key={section.id} className="documentation-index-section" aria-labelledby={section.id}>
        <header>
          <small aria-hidden="true">{ordinal(sectionIndex)}</small>
          <h2 id={section.id}>{section.title} <span className="documentation-index-count">{count(section)}</span></h2>
          <p>{section.description}</p>
          {section.groups.length > 1 && <nav className="documentation-index-groups" aria-label={tw ? `${section.title}分類` : `${section.title} categories`}>
            {section.groups.map((group, index) => <a key={groupId(section, index)} href={`#${groupId(section, index)}`}>{group.title}</a>)}
          </nav>}
        </header>
        {section.groups.length === 1
          ? <EntryLinks entries={section.groups[0].entries} columns={!showDescriptions} showDescriptions={showDescriptions} />
          : <div className="documentation-index-categories">{section.groups.map((group, index) => <section key={groupId(section, index)} aria-labelledby={groupId(section, index)}>
            <h3 id={groupId(section, index)}>{group.title} <span className="documentation-index-count">{group.entries.length}</span></h3>
            <EntryLinks entries={group.entries} columns />
          </section>)}</div>}
      </section>)}
    </div>

    <div id={panelId('alphabetical')} hidden={!alphabetical}>
      <nav className="documentation-index-letters" aria-label={tw ? '依字母跳轉' : 'Jump to a letter'}>
        {[...letters.keys()].map(letter => <a key={letter} href={`#${letterId(letter)}`}>{letter}</a>)}
      </nav>
      {/* A book's index: letters run in columns, each title followed by its section. */}
      <div className="documentation-index-alphabet">
        {[...letters].map(([letter, documents]) => <section key={letter} aria-labelledby={letterId(letter)}>
          <h2 id={letterId(letter)}>{letter}</h2>
          <EntryLinks entries={documents} showCategory />
        </section>)}
      </div>
    </div>
  </div>
}

function EntryLinks({ entries, columns, showCategory, showDescriptions }: { entries: DocumentationIndexEntry[]; columns?: boolean; showCategory?: boolean; showDescriptions?: boolean }) {
  const $ = useTranslation()
  // Described entries read as ruled rows with their summary; bare titles stay a quiet list of links.
  return <ul className="documentation-index-links" data-columns={columns || undefined} data-described={showDescriptions || undefined}>
    {entries.map(entry => <li key={entry.id}>
      <Link href={entry.url} disabled={entry.disabled} unfinished={entry.unfinished}>
        <b>{entry.displayTitle || entry.title}</b>
        {showDescriptions && entry.description && <span>{$(entry.description)}</span>}
        {showCategory && <small>{$(entry.category)}</small>}
      </Link>
    </li>)}
  </ul>
}
