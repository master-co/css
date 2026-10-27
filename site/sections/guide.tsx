import type { ReactNode } from 'react'
import DocumentShell from './document'
import DocHeader from '~/site/docs-shell/components/DocHeader'
import DocSidebar from '~/site/docs-shell/components/DocSidebar'
import DocWrapper from '~/site/docs-shell/components/DocWrapper'
import pageCategories from '~/site/.categories/guide.json'
import type { MetadataTitle } from '~/site/docs-shell/types/Metadata'

export const bodyClass = 'bg-surface-base'

// The sidebar is a client island; serialize only the fields it renders on every page.
const sidebarCategories = pageCategories.map(({ name, pages }) => ({
  name,
  pages: pages.map(({ title, pathname, other }: { title: MetadataTitle, pathname: string, other?: { subject: string } }) => other ? { title, pathname, other } : { title, pathname })
}))

export default function GuideSection({ children }: { children: ReactNode }) {
  return <DocumentShell>
    <DocHeader contained />
    <DocWrapper>
      <DocSidebar pageCategories={sidebarCategories} />
      {children}
    </DocWrapper>
  </DocumentShell>
}
