import { dirname } from 'path'
import { fileURLToPath } from 'node:url'
import metadata from './metadata'
import Content from './content.mdx'
import generate from 'internal/utils/generate-metadata'
import Layout from 'internal/layouts/doc'
import ESLintSvg from '~/site/public/icons/eslint.svg'

export const dynamic = 'force-static'
export const revalidate = false

export async function generateMetadata(props: any, parent: any) {
    return await generate(metadata, props, parent)
}

import pageCategories from '~/site/.categories/guide.json'

export default async function Page(props: any) {
    return (
        <Layout {...props} pageCategories={pageCategories} pageFileURL={import.meta.url} metadata={metadata} icon={<ESLintSvg width={90} />}>
            <Content />
        </Layout >
    )
}