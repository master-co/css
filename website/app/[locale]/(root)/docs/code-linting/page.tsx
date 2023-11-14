import metadata from './metadata'
import Content from './content.mdx'
import { generate } from '~/utils/metadata'
import { queryDictionary } from 'websites/dictionaries'
import DocLayout from '~/layouts/doc'
import ESLintSvg from '~/public/icons/eslint.svg?inlineSvg'

export async function generateMetadata(props: any, parent: any) {
    return generate(metadata, props, parent)
}

export default async function Layout(props: any) {
    const $ = await queryDictionary(props.params.locale)
    return (
        <DocLayout {...props} metadata={metadata} icon={{
            Element: ESLintSvg,
            class: 'w:90'
        }}>
            <Content />
        </DocLayout >
    )
}