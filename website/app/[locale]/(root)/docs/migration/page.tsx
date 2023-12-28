import metadata from './metadata'
import Content from './content.mdx'
import { generate } from '~/utils/metadata'
import { getDictionary } from 'websites/dictionaries'
import DocLayout from '~/layouts/doc'

export const dynamic = 'force-static'
export const revalidate = false

export async function generateMetadata(props: any, parent: any) {
    return generate(metadata, props, parent)
}

export default function Layout(props: any) {
    const $ = getDictionary(props.params.locale)
    return (
        <DocLayout {...props} metadata={metadata} titleBig>
            <Content />
        </DocLayout >
    )
}