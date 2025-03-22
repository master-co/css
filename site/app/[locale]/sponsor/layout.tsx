import Body from 'internal/layouts/body'
import i18n from 'internal/common/i18n.config.mjs'
import DocHeader from 'internal/components/DocHeader'
import HTML from 'internal/layouts/html'

export async function generateStaticParams() {
    return i18n.locales.map((locale: any) => ({ locale }))
}

export default async function Layout({ children, locale }: {
    children: React.ReactNode,
    locale: typeof i18n.locales[number]
}) {
    return (
        <HTML locale={locale}>
            <Body className="bg:base">
                <DocHeader contained />
                {children}
            </Body>
        </HTML>
    )
}
