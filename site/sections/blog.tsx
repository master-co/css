import type { ReactNode } from 'react'
import DocumentShell from './document'
import DocHeader from '~/site/docs-shell/components/DocHeader'

export const bodyClass = 'background-repeat:no-repeat background-image:linear-gradient(oklch(100%|0|none),var(--color-neutral-0)|100vh,var(--color-neutral-0)) background-size:cover background-image:linear-gradient(var(--color-gray-90),var(--color-gray-95)|100vh,var(--color-gray-95))@apply(--site-dark)'

export default function BlogSection({ children }: { children: ReactNode }) {
  return <DocumentShell>
    <DocHeader stickable />
    {children}
  </DocumentShell>
}
