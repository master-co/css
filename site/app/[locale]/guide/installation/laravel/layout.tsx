import { createTranslation } from 'internal/utils/i18n'
import DocLayout from 'internal/layouts/doc'
import metadata from './metadata'

export default async function Layout(props: any) {
    const { locale } = await props.params
    const $ = createTranslation(locale)
    return (
        <DocLayout {...props}
            metadata={metadata}
            backOnClickCategory='/guide/installation/integrations'
            brandName='laravel'
        >
            {props.children}
        </DocLayout >
    )
}