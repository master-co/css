import Body from 'internal/layouts/body'
import i18n from 'internal/common/i18n.config.js'
import DocHeader from 'internal/components/DocHeader'
import DocWrapper from '~/internal/components/DocWrapper'

export async function generateStaticParams() {
  return i18n.locales.map((locale: any) => ({ locale }))
}

export default async function Layout({ children }: {
  children: React.ReactNode
}) {
  return (
    <Body className="bg-cover bg-no-repeat bg:linear-gradient(white,neutral-0|100vh,neutral-0) bg:linear-gradient(gray-90,gray-95|100vh,gray-95)@dark">
      <DocHeader stickable />
      {children}
    </Body>
  )
}
