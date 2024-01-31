import DocHeader from '~/components/DocHeader'
import DocSidebar from '~/components/DocSidebar'

export const dynamic = 'force-static'

export default async function Layout({ children }: any) {
    return <>
        <DocHeader contained />
        <DocSidebar />
        {children}
    </>
}