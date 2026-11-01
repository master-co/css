import Code from '~/site/docs-shell/components/Code'
import DocumentCodeExampleView, { type DocumentCodeExampleViewProps } from './DocumentCodeExampleView'

export interface DocumentCodeExampleProps extends Omit<DocumentCodeExampleViewProps, 'sourceCode' | 'resultCode'> {
  language: string
  resultLanguage?: string
  source: string
  result?: string
  sourceLabel?: string
  resultLabel?: string
}

export default function DocumentCodeExample({ language, resultLanguage = language, source, result, sourceLabel = 'Source', resultLabel = 'Result', ...props }: DocumentCodeExampleProps) {
  return <DocumentCodeExampleView {...props}
    sourceCode={<Code lang={language} name={sourceLabel}>{source}</Code>}
    resultCode={result === undefined ? undefined : props.resultKind === 'generated-css'
      ? <Code lang={resultLanguage}>{result}</Code>
      : <Code lang={resultLanguage} name={resultLabel}>{result}</Code>}
  />
}
