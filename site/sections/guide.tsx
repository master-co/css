import type { ReactNode } from 'react'
import DocumentShell from './document'
import DocHeader from '~/site/docs-shell/components/DocHeader'
import DocSidebar from '~/site/docs-shell/components/DocSidebar'
import DocWrapper from '~/site/docs-shell/components/DocWrapper'
import pageCategories from '~/site/.categories/guide.json'

export const bodyClass = 'bg-surface-base'

export default function GuideSection({ children }: { children: ReactNode }) {
  return <DocumentShell>
    <DocHeader contained />
    <DocWrapper>
      <DocSidebar pageCategories={pageCategories} />
      {children}
    </DocWrapper>
  </DocumentShell>
}
