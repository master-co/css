import DocHeader from '~/components/DocHeader'
import DocSidebar from '~/components/DocSidebar'

export default function Layout(props: any) {
    const { children, params } = props
    return <>
        <DocHeader locale={params.locale} contained />
        <DocSidebar locale={params.locale} />
        {children}
    </>
}