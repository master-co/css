import Body from 'internal/layouts/body'
import i18n from 'internal/common/i18n.config.mjs'
import DocHeader from 'internal/components/DocHeader'
import DocWrapper from '~/internal/components/DocWrapper'

export async function generateStaticParams() {
    return i18n.locales.map((locale: any) => ({ locale }))
}

export default async function Layout({ children }: {
    children: React.ReactNode
}) {
    return (
        <Body className="bg-cover background-image:linear-gradient(var(--color-canvas),var(--color-surface)|100vh,var(--color-surface)) bg-no-repeat">
            <DocHeader stickable />
            {children}
        </Body>
    )
}
