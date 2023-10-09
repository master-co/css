import metadata from './metadata'
import Content from './content.mdx'
import { generate } from '~/utils/metadata'
import { queryDictionary } from 'shared/dictionaries';
import DocLayout from '~/layouts/doc'
import ESLintSvg from 'shared/icons/eslint.svg'

export async function generateMetadata(props: any, parent: any) {
    return generate(metadata, props, parent)
}

export default async function Layout(props: any) {
    const $ = await queryDictionary(props.params.locale)
    return (
        /* @ts-expect-error server component */
        <DocLayout {...props} metadata={metadata} icon={{
            Element: ESLintSvg,
            class: 'w:90'
        }}>
            <Content />
        </DocLayout >
    )
}