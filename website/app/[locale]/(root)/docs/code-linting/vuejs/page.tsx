import Layout from '~/layouts/doc'
import metadata from './metadata'
import Content from './content.mdx'
import { generate } from '~/utils/metadata'
import LogoSvg from '~/public/images/frameworks/vuejs.svg?inlineSvg'

export const dynamic = 'force-static'
export const revalidate = false

export async function generateMetadata(props: any, parent: any) {
    return generate(metadata, props, parent)
}

export default async function Page(props: any) {
    return (
        <Layout {...props}
            metadata={metadata}
            backOnClickCategory='/docs/code-linting'
            icon={<LogoSvg width={64} />}
        >
            <Content />
        </Layout >
    )
}