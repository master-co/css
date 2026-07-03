import i18n from '~/internal/common/i18n.config.js'
import DocHeader from '~/internal/components/DocHeader'
import Body from '~/internal/layouts/body'
import { importTranslations } from '~/internal/utils/i18n'
import dictionaries from '~/site/dictionaries'
import HomePage from './_home/HomePage'

export const dynamic = 'force-static'
export const revalidate = false

export async function generateStaticParams() {
    return i18n.locales.map((locale: any) => ({ locale }))
}

export default async function Page({ params }: {
    params: Promise<{ locale: typeof i18n.locales[number] }>
}) {
    const { locale } = await params
    const translations = await importTranslations(locale, dictionaries)
    const t = (text: string) => translations[text] || text

    return (
        <Body className="bg-cover bg-no-repeat background-image:linear-gradient(var(--color-surface-base),var(--color-surface-raised)|100vh,var(--color-surface-base)) bg:surface-base">
            <DocHeader stickable className="site-home-header" primaryNavClassName="site-home-header-primary-nav" />
            <HomePage t={t} />
        </Body>
    )
}

export const metadata = {
    title: 'Master CSS - The CSS language and framework',
    description: 'The CSS language and framework for rapidly building modern and high-performance websites.'
}
