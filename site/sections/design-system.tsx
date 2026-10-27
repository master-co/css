import type { ReactNode } from 'react'
import DocumentShell from './document'
import DocHeader from '~/site/docs-shell/components/DocHeader'
import DocWrapper from '~/site/docs-shell/components/DocWrapper'

export const bodyClass = 'bg-surface-base'

export default function DesignSystemSection({ children }: { children: ReactNode }) {
  return <DocumentShell>
    <DocHeader contained />
    <DocWrapper>
      {children}
    </DocWrapper>
  </DocumentShell>
}
