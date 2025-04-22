import Layout from 'internal/layouts/doc'
import metadata from './metadata'
import Content from './content.mdx'
import generate from 'internal/utils/generate-metadata'
import dictionaries from '~/site/dictionaries'

export const dynamic = 'force-static'
export const revalidate = false

export async function generateMetadata(props: any, parent: any) {
    return await generate(metadata, props, dictionaries, parent)
}

import pageCategories from '~/site/.categories/messages.json'

export default async function Page(props: any) {
    return (
        <Layout {...props} pageCategories={pageCategories} pageFileURL={import.meta.url} dictionaries={dictionaries} metadata={metadata}>
            <Content pageCategories={pageCategories} />
        </Layout >
    )
}