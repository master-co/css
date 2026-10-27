import '~/site/styles/demo-interactions.css'
import '~/site/styles/demo.css'
export interface DemoIndexGroup {
  title: string
  links: readonly { href: string, label: string }[]
}

/** Native links keep catalog navigation available before hydration. */
export default function DemoIndex({ label, groups }: { label: string, groups: readonly DemoIndexGroup[] }) {
  return <nav className="demo-index" aria-label={label}>
    {groups.map(group => <div className="demo-index-group" key={group.title}>
      <p className="demo-index-title">{group.title}</p>
      <ul>{group.links.map(link => <li key={link.href}><a href={link.href}>{link.label}</a></li>)}</ul>
    </div>)}
  </nav>
}
