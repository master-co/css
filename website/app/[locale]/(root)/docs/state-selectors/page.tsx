import metadata from './metadata'
/* @ts-expect-error toc */
import Content, { toc } from './content.mdx'
import Layout from '~/layouts/doc'
import { generate } from '~/utils/metadata'

export const dynamic = 'force-static'
export const revalidate = false

export async function generateMetadata(props: any, parent: any) {
    return await generate(metadata, props, parent)
}

export default async function Page(props: any) {
    return (
        <Layout {...props} metadata={metadata} toc={toc} titleBig>
            <Content />
        </Layout >
    )
}