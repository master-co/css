import metadata from './metadata'
import Content from './content.mdx'
import { generate } from '~/utils/metadata'
import DocLayout from '~/layouts/doc'
import ESLintSvg from '~/public/icons/eslint.svg?inlineSvg'

export const dynamic = 'force-static'
export const revalidate = false

export async function generateMetadata(props: any, parent: any) {
    return await generate(metadata, props, parent)
}

export default async function Page(props: any) {
    return (
        <DocLayout {...props} metadata={metadata} titleBig icon={<ESLintSvg width={90} />}>
            <Content />
        </DocLayout >
    )
}