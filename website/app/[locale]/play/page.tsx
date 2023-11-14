import metadata from './metadata'
import Play from './Play'
import { queryDictionary } from 'websites/dictionaries'
import { generate } from '~/utils/metadata'
import i18n from 'websites/i18n.config.mjs'

export async function generateStaticParams() {
    return i18n.locales.map((locale: any) => ({ locale }))
}

export async function generateMetadata(props: any, parent: any) {
    return generate(metadata, props, parent)
}

export default async function Page(props: any) {
    const $ = await queryDictionary(props.params.locale)
    return (
        <Play locale={props.params.locale} dict={{
            Docs: $('Docs'),
            Play: $('Play'),
            Roadmap: $('Roadmap'),
            Blog: $('Blog'),
            Components: $('Components'),
            'Sharing ...': $('Sharing ...'),
            Share: $('Share')
        }} />
    )
}