import Code from '~/site/docs-shell/components/Code'
import DocumentDeclarationView from './DocumentDeclarationView'

export default function DocumentDeclaration({ label, children }: { label: string, children: string }) {
  return <DocumentDeclarationView label={label} source={children}>
    <Code lang="typescript" beautify={false} dedent={false} copyable={false}>{children}</Code>
  </DocumentDeclarationView>
}
