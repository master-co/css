import Code from '~/site/docs-shell/components/Code'
import DocumentDeclarationView from './DocumentDeclarationView'

export default function DocumentDeclaration({ children }: { label?: string, children: string }) {
  return <DocumentDeclarationView source={children}>
    <Code lang="typescript" beautify={false} dedent={false}>{children}</Code>
  </DocumentDeclarationView>
}
