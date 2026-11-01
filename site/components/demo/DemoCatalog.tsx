import '~/site/styles/demo.css'
import type { ReactNode } from 'react'
import DemoIndex from './DemoIndex'

export interface DemoCatalogGroup {
  id: string
  title: string
  entries: readonly { id: string, title: string, label: string, href?: string, children: ReactNode }[]
}

/** The complete specimens stay server-rendered inside native disclosures. */
export default function DemoCatalog({ groups }: { groups: readonly DemoCatalogGroup[] }) {
  return <div className="ui-catalog">
    <DemoIndex label="Utility recipe categories" groups={[{
      title: 'Choose a behavior',
      links: groups.map(group => ({ href: `#${group.id}`, label: `${group.title} · ${group.entries.length}` }))
    }]} />
    {groups.map(group => <section key={group.id} aria-labelledby={group.id}>
      <h3 id={group.id}>{group.title}<small>{group.entries.length} recipes</small></h3>
      {group.entries.map(entry => <details key={entry.id} className="ui-disclosure" data-variant="rule" suppressHydrationWarning>
        <summary>{entry.title}<span className="ui-disclosure-meta">{entry.label}</span></summary>
        <div className="ui-catalog-entry">
          {entry.href && <a href={entry.href}>Read related documentation ↗</a>}
          {entry.children}
        </div>
      </details>)}
    </section>)}
  </div>
}
