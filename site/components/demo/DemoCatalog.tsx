import '~/site/styles/demo-interactions.css'
import '~/site/styles/demo.css'
import type { ReactNode } from 'react'
import DemoIndex from './DemoIndex'

export interface DemoCatalogGroup {
  id: string
  title: string
  entries: readonly { id: string, title: string, label: string, href: string, children: ReactNode }[]
}

/** The complete specimens stay server-rendered inside native disclosures. */
export default function DemoCatalog({ groups }: { groups: readonly DemoCatalogGroup[] }) {
  return <div className="demo-catalog">
    <DemoIndex label="Utility recipe categories" groups={[{
      title: 'Choose a behavior',
      links: groups.map(group => ({ href: `#${group.id}`, label: `${group.title} · ${group.entries.length}` }))
    }]} />
    {groups.map(group => <section key={group.id} aria-labelledby={group.id} className="demo-catalog-group">
      <h3 id={group.id}>{group.title}<span>{group.entries.length} recipes</span></h3>
      {group.entries.map(entry => <details key={entry.id} className="demo-recipe" suppressHydrationWarning>
        <summary><span className="demo-recipe-marker" aria-hidden="true" /><span>{entry.title}</span><code>{entry.label}</code></summary>
        <div className="demo-recipe-content">
          <a href={entry.href} className="demo-recipe-link">Read the example and source ↗</a>
          {entry.children}
        </div>
      </details>)}
    </section>)}
  </div>
}
