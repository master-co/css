import { importTranslations } from '~/i18n'
import RootLayout from '../../root.layout'
import i18n from '~/i18n.config.mjs'

export const metadata = {
    title: {
        template: '%s - Master CSS',
        default: 'Master CSS'
    }
}

export async function generateStaticParams() {
    return i18n.locales.map((locale: any) => ({ locale }))
}

export default async function Layout({ children, params }: {
    children: JSX.Element,
    params: { locale: typeof i18n.locales[number] }
}) {
    return (
        <RootLayout bodyClassName='bg:base' locale={params.locale} translations={await importTranslations(params.locale)}>{children}</RootLayout>
    )
}
