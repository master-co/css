import Body from 'internal/layouts/body'
import metadata from './metadata'
import generate from 'internal/utils/generate-metadata'
import dictionaries from '~/site/dictionaries'

export async function generateMetadata(props: any, parent: any) {
    return await generate(metadata, props, dictionaries, parent)
}

export default async function Layout({ children }: {
    children: React.ReactElement
}) {
    return (
        <Body className="bg:base">
            {children}
        </Body>
    )
}
