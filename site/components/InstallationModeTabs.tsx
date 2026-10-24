import Tabs, { Tab } from '~/site/docs-shell/components/Tabs'
import { usePathname } from '~/site/docs-shell/layouts/root'

export interface InstallationModeTab {
  href: string
  label: string
  aliases?: readonly string[]
}

/** Reuse the site's navigation appearance while recognizing legacy mode URLs. */
export default function InstallationModeTabs({ items }: { items: readonly InstallationModeTab[] }) {
  const pathname = usePathname()
  return <Tabs className="mb-xl">
    {items.map(item => {
      const active = pathname === item.href || Boolean(item.aliases?.includes(pathname ?? ''))
      return <Tab key={item.href} href={item.href} active={active} aria-current={active ? 'page' : undefined}>
        {item.label}
      </Tab>
    })}
  </Tabs>
}
