import { Locale } from 'websites/i18n.config'
import RootLayout from '../root.layout'

export default async function Layout(props: {
    children: JSX.Element,
    params: { locale: Locale }
}) {
    return (
        <RootLayout {...props} bodyAttrs={{ className: 'bg:base' }} />
    )
}
