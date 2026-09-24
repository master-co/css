import Body from '~/site/docs-shell/layouts/body'
import i18n from '~/site/docs-shell/common/i18n.config.js'
import DocHeader from '~/site/docs-shell/components/DocHeader'

export async function generateStaticParams() {
  return i18n.locales.map((locale: any) => ({ locale }))
}

export default async function Layout({ children }: {
  children: React.ReactNode
}) {
  return (
    <Body className="bg-surface-base">
      <DocHeader contained />
      {children}
    </Body>
  )
}
