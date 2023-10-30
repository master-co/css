import '../../globals.css'
import i18n from 'shared/i18n.config.mjs'
import { Locale } from 'shared/i18n.config'
import RootLayout from '../root.layout'

export default async function Layout(props: {
    children: JSX.Element,
    params: { locale: Locale }
}) {
    return (
        // @ts-expect-error server component
        <RootLayout {...props} />
    )
}
