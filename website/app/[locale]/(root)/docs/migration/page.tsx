import metadata from './metadata'
import Content from './content.mdx'
import { generate } from '~/utils/metadata'
import { createTranslation } from '~/i18n'
import DocLayout from '~/layouts/reference'

export const dynamic = 'force-static'
export const revalidate = false

export async function generateMetadata(props: any, parent: any) {
    return await generate(metadata, props, parent)
}

export default async function Layout(props: any) {
    const $ = await createTranslation(props.params.locale)
    return (
        <DocLayout {...props} metadata={metadata}>
            <Content />
        </DocLayout >
    )
}