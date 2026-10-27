import type { ReactNode } from 'react'
import Link from '~/site/docs-shell/components/Link'

const actionClassNames = {
  primary: 'home-action home-action-primary',
  secondary: 'home-action app-object app-object-interactive'
}

export default function HomeAction({ children, href, variant }: { children: ReactNode, href: string, variant: keyof typeof actionClassNames }) {
  return <Link className={actionClassNames[variant]} href={href}>{children}</Link>
}
