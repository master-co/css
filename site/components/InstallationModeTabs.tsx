import Tabs, { Tab } from '~/site/docs-shell/components/Tabs'
import { usePathname } from '~/site/docs-shell/layouts/root'

export interface InstallationModeTab {
  href: string
  label: string
}

/** Reuse the site's navigation appearance for sibling setup guides. */
export default function InstallationModeTabs({ items }: { items: readonly InstallationModeTab[] }) {
  const pathname = usePathname()
  return <Tabs className="mb-xl">
    {items.map(item => {
      const active = pathname === item.href
      return <Tab key={item.href} href={item.href} active={active} aria-current={active ? 'page' : undefined}>
        {item.label}
      </Tab>
    })}
  </Tabs>
}
