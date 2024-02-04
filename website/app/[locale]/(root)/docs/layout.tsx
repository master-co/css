'use client'

import DocHeader from '~/components/DocHeader'
import DocSidebar from '~/components/DocSidebar'

export default function Layout({ children }: any) {
    return <>
        <DocHeader contained />
        <DocSidebar />
        {children}
    </>
}