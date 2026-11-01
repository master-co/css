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

/** Labels name the two sides of a pair; a source alone, or above its Generated CSS disclosure, needs none. */
export default function DocumentCodeExample({ language, resultLanguage = language, source, result, sourceLabel, resultLabel = 'Result', ...props }: DocumentCodeExampleProps) {
  const pair = result !== undefined && props.resultKind !== 'generated-css'
  return <DocumentCodeExampleView {...props}
    sourceCode={<Code lang={language} name={sourceLabel ?? (pair ? 'Source' : undefined)}>{source}</Code>}
    resultCode={result === undefined ? undefined : props.resultKind === 'generated-css'
      ? <Code lang={resultLanguage}>{result}</Code>
      : <Code lang={resultLanguage} name={resultLabel}>{result}</Code>}
  />
}
