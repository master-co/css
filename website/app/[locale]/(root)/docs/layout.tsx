import DocHeader from '~/layouts/DocHeader'
import DocSidebar from 'websites/components/DocSidebar';
import { pageCategories } from '~/app/[locale]/(root)/pages';

export default async function Layout(props: any) {
    const { children, params } = props
    return <>
        {/* @ts-expect-error server component */}
        <DocHeader locale={params.locale} contained />
        {/* @ts-expect-error server component */}
        <DocSidebar locale={params.locale} pageCategories={pageCategories} />
        {children}
    </>
}