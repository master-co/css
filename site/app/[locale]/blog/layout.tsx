import Body from '~/site/docs-shell/layouts/body'
import i18n from '~/site/docs-shell/common/i18n.config.js'
import DocHeader from '~/site/docs-shell/components/DocHeader'
import DocWrapper from '~/site/docs-shell/components/DocWrapper'

export async function generateStaticParams() {
  return i18n.locales.map((locale: any) => ({ locale }))
}

export default async function Layout({ children }: {
  children: React.ReactNode
}) {
  return (
    <Body className="bg-cover bg-no-repeat background-image:linear-gradient(oklch(100%|0|none),var(--color-neutral-0)|100vh,var(--color-neutral-0)) background-image:linear-gradient(var(--color-gray-90),var(--color-gray-95)|100vh,var(--color-gray-95))@dark">
      <DocHeader stickable />
      {children}
    </Body>
  )
}
