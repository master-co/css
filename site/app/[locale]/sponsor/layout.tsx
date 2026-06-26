import Body from 'internal/layouts/body'
import i18n from 'internal/common/i18n.config.js'
import DocHeader from 'internal/components/DocHeader'

export async function generateStaticParams() {
    return i18n.locales.map((locale: any) => ({ locale }))
}

export default async function Layout({ children }: {
    children: React.ReactNode
}) {
    return (
        <Body className="bg:canvas">
            <DocHeader contained />
            {children}
        </Body>
    )
}
