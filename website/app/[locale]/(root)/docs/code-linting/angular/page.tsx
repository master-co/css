import Layout from '~/layouts/doc'
import metadata from './metadata'
import Content from './content.mdx'
import { generate } from '~/utils/metadata'
import LogoSvg from '~/public/images/frameworks/angular.svg'
import { queryDictionary } from 'websites/dictionaries'

export async function generateMetadata(props: any, parent: any) {
    return generate(metadata, props, parent)
}

export default async function Page(props: any) {
    const $ = await queryDictionary(props.params.locale)
    return (
        <Layout {...props}
            metadata={metadata}
            backOnClickCategory='/docs/code-linting'
            icon={{ Element: LogoSvg, class: 'w:100' }}
        >
            <Content />
        </Layout >
    )
}