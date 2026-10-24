import type { ReactNode } from 'react'
import DocumentShell from './document'

export const bodyClass = 'background-repeat:no-repeat background-image:linear-gradient(var(--color-surface-base),var(--color-surface-raised)|100vh,var(--color-surface-raised)) background-size:cover'

export default function HomeSection({ children }: { children: ReactNode }) {
  return <DocumentShell>{children}</DocumentShell>
}
