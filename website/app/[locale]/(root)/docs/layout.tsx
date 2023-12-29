'use client'

import DocHeader from '~/components/DocHeader'
import DocSidebar from 'websites/components/DocSidebar'
import { pageCategories } from '~/app/[locale]/(root)/pages'

export default function Layout(props: any) {
    const { children, params } = props
    return <>
        <DocHeader locale={params.locale} contained />
        <DocSidebar locale={params.locale} pageCategories={pageCategories} />
        {children}
    </>
}