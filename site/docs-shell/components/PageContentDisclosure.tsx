import { IconChevronDown } from '@tabler/icons-react'
import type { PageContentItem } from './PageContentContext'
import PageContentTitle from './PageContentTitle'
import '~/site/styles/docs-shell/contents-disclosure.css'
import '~/site/styles/docs-shell/page-content.css'

/** The same heading inventory as the desktop rail, drawn as the same ruler, available without hydration. */
export default function PageContentDisclosure({ items, label, labelLang }: { items: (PageContentItem & { lang?: string })[], label: string, labelLang?: string }) {
  return <details className="doc-contents-disclosure" data-contents-disclosure="">
    <summary lang={labelLang}>{label}<IconChevronDown size={16} stroke={1.5} aria-hidden="true" /></summary>
    <nav className="page-content" aria-label={label}>
      <ol className="page-content-list">{items.map(item => <li key={item.id}><a className="page-content-link" data-level={item.level} href={`#${item.id}`} lang={item.lang}><PageContentTitle title={item.title} /></a></li>)}</ol>
    </nav>
  </details>
}
