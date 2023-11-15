import Play from './Play'
import { queryDictionary } from 'websites/dictionaries'
import i18n from 'websites/i18n.config.mjs'

export async function generateStaticParams() {
    return i18n.locales.map((locale: any) => ({ locale }))
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