import i18n from '~/site/docs-shell/common/i18n.config.js'
import DocHeader from '~/site/docs-shell/components/DocHeader'
import Body from '~/site/docs-shell/layouts/body'

export const dynamic = 'force-static'
export const revalidate = false
// `[locale]` matches every single-segment request, so an unknown top-level path such as
// /sw.js resolves to this page. The default is unsupported with `output: export`, and it
// leaves those requests answering 500 rather than serving the 404 page.
export const dynamicParams = false

export async function generateStaticParams() {
  return i18n.locales.map((locale: any) => ({ locale }))
}

export default function Page() {
  return (
    <Body className="bg-cover bg-no-repeat background-image:linear-gradient(var(--color-surface-base),var(--color-surface-raised)|100vh,var(--color-surface-raised))">
      <DocHeader stickable />
    </Body>
  )
}

export const metadata = {
  title: 'Master CSS - The CSS language and framework',
  description: 'The CSS language and framework for rapidly building modern and high-performance websites.'
}
