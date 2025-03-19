import Body from 'internal/layouts/body'
import i18n from 'internal/common/i18n.config.mjs'
import DocHeader from 'internal/components/DocHeader'
import DocSidebar from 'internal/components/DocSidebar'

export async function generateStaticParams() {
    return i18n.locales.map((locale: any) => ({ locale }))
}

import pageCategories from '~/site/.categories/messages.json'

export default async function Layout({ children }: {
    children: React.ReactElement
}) {
    return (
        <Body className="bg:base">
            <DocHeader contained />
            <DocSidebar pageCategories={pageCategories} />
            {children}
        </Body>
    )
}


