import metadata from './metadata'
import Content from './content.mdx'
import { generate } from '~/utils/metadata'
import DocLayout from '~/layouts/doc'
import ESLintSvg from '~/public/icons/eslint.svg?inlineSvg'
import { useTranslation } from 'websites/contexts/i18n'

export const dynamic = 'force-static'
export const revalidate = false

export async function generateMetadata(props: any, parent: any) {
    return generate(metadata, props, parent)
}

export default async function Page(props: any) {
    const $ = useTranslation()
    return (
        <DocLayout {...props} metadata={metadata} titleBig icon={<ESLintSvg width={90} />}>
            <Content />
        </DocLayout >
    )
}