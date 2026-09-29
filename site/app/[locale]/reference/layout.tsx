import '~/site/styles/reference.css'
import Body from '~/site/docs-shell/layouts/body'
import i18n from '~/site/docs-shell/common/i18n.config.js'
import DocHeader from '~/site/docs-shell/components/DocHeader'
import ReferenceNavigation from '~/site/reference/Navigation'
import { routeIndex } from '~/site/reference/route-index'
import pageCategories from '~/site/.categories/reference.json'
import DocWrapper from '~/site/docs-shell/components/DocWrapper'

export async function generateStaticParams() {
  return i18n.locales.map((locale: any) => ({ locale }))
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Body className="bg-surface-base">
      <DocHeader contained />
      <DocWrapper>
        <ReferenceNavigation categoryOrder={pageCategories.map(category => category.name)} documents={routeIndex} />
        {children}
      </DocWrapper>
    </Body>
  )
}
