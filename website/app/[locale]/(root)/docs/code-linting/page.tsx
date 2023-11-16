import metadata from './metadata'
import Content from './content.mdx'
import { generate } from '~/utils/metadata'
import { queryDictionary } from 'websites/dictionaries'
import DocLayout from '~/layouts/doc'
import ESLintSvg from '~/public/icons/eslint.svg?inlineSvg'

export const dynamic = 'force-static'
export const revalidate = false

export async function generateMetadata(props: any, parent: any) {
    return generate(metadata, props, parent)
}

export default async function Page(props: any) {
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