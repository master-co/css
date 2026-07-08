import Body from 'internal/layouts/body'
import i18n from 'internal/common/i18n.config.js'
import HTML from 'internal/layouts/html'

export const metadata = {
  title: {
    template: '%s - Master CSS',
    default: 'Master CSS'
  }
}

export async function generateStaticParams() {
  return i18n.locales.map((locale: any) => ({ locale }))
}

export default async function Layout({ children }: {
  children: React.ReactNode
}) {
  return (
    <HTML locale="en">
      <Body>
        {children}
      </Body>
    </HTML>
  )
}
