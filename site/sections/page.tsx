import type { ReactNode } from 'react'
import DocumentShell from './document'
import DocHeader from '~/site/docs-shell/components/DocHeader'

export const bodyClass = 'bg-surface-base'

/** Standalone pages such as Brand and Sponsor. */
export default function PageSection({ children }: { children: ReactNode }) {
  return <DocumentShell>
    <DocHeader contained />
    {children}
  </DocumentShell>
}
