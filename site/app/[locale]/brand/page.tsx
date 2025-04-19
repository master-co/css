
import Layout from 'internal/layouts/article'
import metadata from './metadata'
import Content from './content.mdx'
import generate from 'internal/utils/generate-metadata'

export const dynamic = 'force-static'
export const revalidate = false

export async function generateMetadata(props: any, parent: any) {
    return await generate(metadata, props, parent)
}

export default async function Page(props: any): Promise<React.ReactNode> {
    return <>
        <Layout {...props} pageFileURL={import.meta.url} metadata={metadata} $hideLeftSide>
            <Content />
        </Layout >
    </>
}
