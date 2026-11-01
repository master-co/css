import '~/site/styles/design-system.css'
import type { ReactNode } from 'react'
import Link from '~/site/docs-shell/components/Link'

export interface ComponentSection {
  id: string
  title: string
  description?: ReactNode
  children: ReactNode
}

/** A component review: what it is, its live states, where the site uses it, and its interface. */
export default function ComponentPage({ title, description, kicker = 'Components', sections, usage, Documentation, documentationTitle = 'Usage and interface' }: {
  title: string
  description: ReactNode
  kicker?: string
  sections: readonly ComponentSection[]
  /** A real page that uses the component. */
  usage?: { href: string, label: string }
  Documentation?: (props: Record<string, never>) => ReactNode
  /** The heading above the documentation; null when the documentation is the whole page. */
  documentationTitle?: string | null
}) {
  return <main className="ui-handbook ui-prose">
    <header className="ui-pagehead">
      <nav className="ui-pagehead-meta" aria-label="Design system navigation">
        <Link href="/design-system">Design system</Link>
        <Link href="/design-system/authoring">Authoring handbook</Link>
      </nav>
      <span className="ui-pagehead-kicker">{kicker}</span>
      <h1>{title}</h1>
      <p>{description}</p>
    </header>
    {sections.map(section => [
      <h2 key={`${section.id}-heading`} id={section.id}>{section.title}</h2>,
      section.description && <p key={`${section.id}-description`}>{section.description}</p>,
      <div key={section.id} className="ui-handbook-section">{section.children}</div>
    ])}
    {usage && <p>Used on <Link href={usage.href}>{usage.label}</Link>.</p>}
    {Documentation && <>
      {documentationTitle && <h2 id="component-interface">{documentationTitle}</h2>}
      <Documentation />
    </>}
  </main>
}
