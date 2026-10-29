import { IconChevronDown } from '@tabler/icons-react'
import type { PageContentItem } from './PageContentContext'
import '~/site/styles/docs-shell/contents-disclosure.css'

/** The same heading inventory as the desktop rail, available without hydration. */
export default function PageContentDisclosure({ items, label }: { items: PageContentItem[], label: string }) {
  return <details className="doc-contents-disclosure" data-contents-disclosure="">
    <summary>{label}<IconChevronDown size={16} stroke={1.5} aria-hidden="true" /></summary>
    <nav aria-label={label}><ol>{items.map(item => <li key={item.id} data-level={item.level}><a href={`#${item.id}`}>{item.title.startsWith('`') ? <code>{item.title.replace(/`/g, '')}</code> : item.title}</a></li>)}</ol></nav>
  </details>
}
