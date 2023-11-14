import DocHeader from '~/layouts/DocHeader'
import DocSidebar from 'websites/components/DocSidebar'
import { pageCategories } from '~/app/[locale]/(root)/pages'

export default async function Layout(props: any) {
    const { children, params } = props
    return <>
        <DocHeader locale={params.locale} contained />
        <DocSidebar locale={params.locale} pageCategories={pageCategories} />
        {children}
    </>
}