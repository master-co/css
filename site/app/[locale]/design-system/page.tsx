import Layout from 'internal/layouts/doc'
import metadata from './metadata'
import Content from './content.mdx'
import generate from 'internal/utils/generate-metadata'
import Body from '~/internal/layouts/body'
import DocHeader from '~/internal/components/DocHeader'

export const dynamic = 'force-static'
export const revalidate = false

export async function generateMetadata(props: any, parent: any) {
    return await generate(metadata, props, parent)
}

export default async function Page(props: any) {
    return (
        <Body className="bg:base">
            <DocHeader contained />
            <Layout {...props} pageFileURL={import.meta.url} metadata={metadata} $hideLeftSide>
                <Content />
            </Layout >
        </Body>
    )
}
