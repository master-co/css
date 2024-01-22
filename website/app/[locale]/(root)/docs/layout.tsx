import DocHeader from '~/components/DocHeader'
import DocSidebar from '~/components/DocSidebar'

export default function Layout(props: any) {
    const { children } = props
    return <>
        <DocHeader contained />
        <DocSidebar />
        {children}
    </>
}