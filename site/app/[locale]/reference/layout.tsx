import Body from 'internal/layouts/body'
import i18n from 'internal/common/i18n.config.js'
import DocHeader from 'internal/components/DocHeader'
import ReferenceNavigation from '~/site/reference/Navigation'
import catalogJSON from '~/site/.generated/reference.json'
import pageCategories from '~/site/.categories/reference.json'
import type { ReferenceCatalog } from '~/site/reference/types'
import DocWrapper from '~/internal/components/DocWrapper'

export async function generateStaticParams() {
  return i18n.locales.map((locale: any) => ({ locale }))
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Body className="bg:surface-base">
      <DocHeader contained />
      <DocWrapper>
        <ReferenceNavigation categoryOrder={pageCategories.map(category => category.name)} documents={(catalogJSON as ReferenceCatalog).documents.map(({ id, kind, title, category, url }) => ({ id, kind, title, category, url }))} />
        {children}
      </DocWrapper>
    </Body>
  )
}
