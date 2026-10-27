import Code from '~/site/docs-shell/components/Code'
import DocumentCodeExampleView, { type DocumentCodeExampleViewProps } from './DocumentCodeExampleView'

export interface DocumentCodeExampleProps extends Omit<DocumentCodeExampleViewProps, 'sourceCode' | 'resultCode'> {
  language: string
  resultLanguage?: string
}

export default function DocumentCodeExample({ language, resultLanguage = language, ...props }: DocumentCodeExampleProps) {
  return <DocumentCodeExampleView {...props}
    sourceCode={<Code lang={language} copyable={false}>{props.source}</Code>}
    resultCode={props.result === undefined ? undefined : <Code lang={resultLanguage} copyable={false}>{props.result}</Code>}
  />
}
