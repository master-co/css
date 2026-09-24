import Body from '~/site/docs-shell/layouts/body'
import metadata from './metadata'
import generate from '~/site/docs-shell/utils/generate-metadata'
import dictionaries from '~/site/dictionaries'

export async function generateMetadata(props: any, parent: any) {
  return await generate(metadata, props, dictionaries, parent)
}

export default async function Layout({ children }: {
  children: React.ReactNode
}) {
  return (
    <Body className="bg-surface-base">
      {children}
    </Body>
  )
}
