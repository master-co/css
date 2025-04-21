import Body from 'internal/layouts/body'
import i18n from 'internal/common/i18n.config.mjs'
import DocHeader from 'internal/components/DocHeader'
import DocSidebar from 'internal/components/DocSidebar'
import pageCategories from 'site/.categories/guide.json'
import DocWrapper from '~/internal/components/DocWrapper'

export async function generateStaticParams() {
    return i18n.locales.map((locale: any) => ({ locale }))
}

export default async function Layout({ children }: {
    children: React.ReactElement,
    locale: typeof i18n.locales[number]
}) {
    return (
        <Body className="bg:base">
            <DocHeader contained />
            <DocWrapper>
                <DocSidebar pageCategories={pageCategories} />
                {children}
            </DocWrapper>
        </Body>
    )
}

