import '~/site/styles/docs-shell/page-content.css'
import type { PageContentItem } from './PageContentContext'
import PageContentTitle from './PageContentTitle'
import groupPageContent from '../utils/group-page-content'

/** The same heading inventory as the documentation rail, closed in a disclosure, available without hydration. */
export default function PageContentDisclosure({ items, label, labelLang }: { items: (PageContentItem & { lang?: string })[], label: string, labelLang?: string }) {
  const entry = (item: PageContentItem & { lang?: string }) => <a href={`#${item.id}`} lang={item.lang}><PageContentTitle title={item.title} /></a>
  return <details className="ui-disclosure" data-variant="rule" data-contents-disclosure="">
    <summary lang={labelLang}>{label}</summary>
    <nav className="ui-toc" aria-label={label}>
      <ol>{groupPageContent(items).map(({ item, children }) => <li key={item.id}>
        {entry(item)}
        {children.length > 0 && <ol>{children.map(child => <li key={child.id}>{entry(child)}</li>)}</ol>}
      </li>)}</ol>
    </nav>
  </details>
}
