import docMenuDict from '~/components/docMenuDict'
import Play from './Play'
import { collectDictionary } from 'websites/dictionaries'

export const dynamic = 'force-static'
export const revalidate = false

export default async function Page(props: any) {
    return (
        <Play locale={props.params.locale} dict={await collectDictionary(props.params.locale, [
            ...docMenuDict,
            'Sharing ...',
            'Share'
        ])} />
    )
}