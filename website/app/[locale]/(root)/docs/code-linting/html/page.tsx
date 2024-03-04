import Layout from '~/layouts/reference'
import metadata from './metadata'
import Content from './content.mdx'
import { generate } from '~/utils/metadata'
import LogoSvg from '~/public/icons/html.svg?inlineSvg'

export const dynamic = 'force-static'
export const revalidate = false

export async function generateMetadata(props: any, parent: any) {
    return await generate(metadata, props, parent)
}

export default async function Page(props: any) {
    return (
        <Layout {...props} pageDirname={__dirname}
            metadata={metadata}

            backOnClickCategory='/docs/code-linting'
            icon={<LogoSvg width={100} />}
        >
            <Content />
        </Layout >
    )
}