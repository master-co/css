import { createTranslation } from 'internal/utils/i18n'
import dictionaries from '~/site/dictionaries'
import DocLayout from 'internal/layouts/doc'
import metadata from './metadata'

export default async function Layout(props: any) {
    const { locale } = await props.params
    const $ = await createTranslation(locale, dictionaries)
    return (
        <DocLayout {...props}
            metadata={metadata}
            dictionaries={dictionaries}
            categoryLink='/guide/installation/integrations'
            brandName='astro'
        >
            {props.children}
        </DocLayout >
    )
}