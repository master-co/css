import '~/site/styles/reference.css'
import type { ReactNode } from 'react'
import DocumentShell from './document'
import DocHeader from '~/site/docs-shell/components/DocHeader'
import DocWrapper from '~/site/docs-shell/components/DocWrapper'
import ReferenceNavigation from '~/site/reference/Navigation'
import { routeIndex } from '~/site/reference/route-index'
import pageCategories from '~/site/.categories/reference.json'
import { referenceNavigationCategories } from '~/site/reference/navigation-data'

export const bodyClass = 'bg-surface-base'
const navigation = referenceNavigationCategories(routeIndex, pageCategories.map(category => category.name))

export default function ReferenceSection({ children }: { children: ReactNode }) {
  return <DocumentShell>
    <DocHeader contained documentNavigation={navigation} documentNavigationTitle="Reference" />
    <DocWrapper>
      <ReferenceNavigation pageCategories={navigation} />
      {children}
    </DocWrapper>
  </DocumentShell>
}
