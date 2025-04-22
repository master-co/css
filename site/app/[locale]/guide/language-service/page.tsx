import DocLayout from 'internal/layouts/doc'
import Content from './content.mdx'
import metadata from './metadata'
import dictionaries from '~/site/dictionaries'
import generate from 'internal/utils/generate-metadata'

export const dynamic = 'force-static'
export const revalidate = false

export async function generateMetadata(props: any, parent: any) {
    return await generate(metadata, props, dictionaries, parent)
}

import pageCategories from '~/site/.categories/guide.json'

export default async function Layout(props: any) {
    const { locale } = await props.params
    return (
        <DocLayout {...props} pageCategories={pageCategories} pageFileURL={import.meta.url} dictionaries={dictionaries} metadata={metadata}>
            <Content />
        </DocLayout >
    )
}