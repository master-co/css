import i18n from '~/internal/common/i18n.config.js'
import RootClient from '../root'
import { importTranslations } from '~/internal/utils/i18n'
import HTML from 'internal/layouts/html'
import dictionaries from '~/site/dictionaries'

export default async function Layout({ children, params }: {
    children: React.ReactNode,
    params: Promise<{ locale: typeof i18n.locales[number] }>
}) {
    const { locale } = await params
    const translations = await importTranslations(locale, dictionaries)
    return (
        <HTML locale={locale}>
            <RootClient locale={locale} translations={translations}>
                {children}
            </RootClient>
        </HTML>
    )
}
