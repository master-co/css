import DocHeader from '~/components/DocHeader'
import DocSidebar from '~/components/DocSidebar'

export default async function Layout(props: any) {
    const { children } = props
    return <>
        <DocHeader />
        <DocSidebar />
        {children}
    </>
}