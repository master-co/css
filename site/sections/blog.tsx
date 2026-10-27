import type { ReactNode } from 'react'
import DocumentShell from './document'
import DocHeader from '~/site/docs-shell/components/DocHeader'

export const bodyClass = 'background-repeat:no-repeat background-image:linear-gradient(oklch(100%|0|none),var(--color-zinc-0)|100vh,var(--color-zinc-0)) background-size:cover background-image:linear-gradient(var(--color-zinc-90),var(--color-zinc-95)|100vh,var(--color-zinc-95))@apply(--site-dark)'

export default function BlogSection({ children }: { children: ReactNode }) {
  return <DocumentShell>
    <DocHeader stickable />
    {children}
  </DocumentShell>
}
