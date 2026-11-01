export interface DemoIndexGroup {
  title: string
  links: readonly { href: string, label: string }[]
}

/** Native links keep catalog navigation available before hydration. */
export default function DemoIndex({ label, groups }: { label: string, groups: readonly DemoIndexGroup[] }) {
  return <nav className="grid gap-md" aria-label={label}>
    {groups.map(group => <div className="grid gap-xs" key={group.title}>
      <p className="m(0) ui-label">{group.title}</p>
      <ul className="flex flex-wrap gap-2xs m(0) p(0) (list-style:none)">{group.links.map(link => <li key={link.href}><a className="ui-button" data-size="sm" href={link.href}>{link.label}</a></li>)}</ul>
    </div>)}
  </nav>
}
