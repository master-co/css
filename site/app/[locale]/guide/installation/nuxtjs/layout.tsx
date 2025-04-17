import Tabs, { Tab, TabBadge } from 'internal/components/Tabs'
import { createTranslation } from 'internal/utils/i18n'
import DocLayout from 'internal/layouts/doc'
import brands from 'internal/data/brands'
import metadata from './metadata'

export default async function Layout(props: any) {
    const { locale } = await props.params
    const $ = createTranslation(locale)
    return (
        <DocLayout {...props}
            metadata={metadata}
            backOnClickCategory='/guide/installation/integrations'
            brand={brands.find(({ name }) => name === 'Nuxt.js')}
        >
            {props.children}
        </DocLayout >
    )
}