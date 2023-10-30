import Layout from '../layout'
import metadata from './metadata'
import Content from './content.mdx'
import { generate } from '~/utils/metadata'

export async function generateMetadata(props: any, parent: any) {
    return generate(metadata, props, parent)
}

export default async function Page(props: any) {
    return (
        <Content />
    )
}