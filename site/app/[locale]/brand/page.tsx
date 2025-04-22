
import Layout from 'internal/layouts/article'
import metadata from './metadata'
import Content from './content.mdx'
import generate from 'internal/utils/generate-metadata'
import dictionaries from '~/site/dictionaries'

export const dynamic = 'force-static'
export const revalidate = false

export async function generateMetadata(props: any, parent: any) {
    return await generate(metadata, props, dictionaries, parent)
}

export default async function Page(props: any): Promise<React.ReactNode> {
    return <>
        <Layout {...props} pageFileURL={import.meta.url} dictionaries={dictionaries} metadata={metadata} $hideLeftSide>
            <Content />
        </Layout >
    </>
}
