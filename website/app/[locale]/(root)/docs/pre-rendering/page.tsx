import Layout from '~/layouts/doc'
import metadata from './metadata'
/* @ts-expect-error toc */
import Content, { toc } from './content.mdx'
import { generate } from '~/utils/metadata'

export async function generateMetadata(props: any, parent: any) {
    return generate(metadata, props, parent)
}

export default async function Page(props: any) {
    return (
        /* @ts-expect-error server component */
        <Layout {...props} metadata={metadata} toc={toc} titleBig={false}>
            <Content />
        </Layout >
    )
}