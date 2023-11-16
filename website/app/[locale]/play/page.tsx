import Play from './Play'
import { queryDictionary } from 'websites/dictionaries'

export const dynamic = 'force-dynamic'
export const revalidate = false

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