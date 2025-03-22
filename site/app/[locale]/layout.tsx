import i18n from '~/internal/common/i18n.config.mjs'
import RootClient from '../root'
import { importTranslations } from '~/internal/utils/i18n'
import HTML from 'internal/layouts/html'

export default async function Layout({ children, params }: {
    children: React.ReactElement,
    params: Promise<{ locale: typeof i18n.locales[number] }>
}) {
    const { locale } = await params
    const translations = importTranslations(locale)
    return (
        <RootClient locale={locale} translations={translations}>
            <HTML locale={locale}>
                {children}
            </HTML>
        </RootClient>
    )
}