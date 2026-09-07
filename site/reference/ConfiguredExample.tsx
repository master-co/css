import Code from 'internal/components/Code'
import React from 'react'
import { configuredExampleCSS } from './configured-example'

export default function ConfiguredExample({ source, classes }: { source: string; classes: string[] }) {
  return <>
    <Code lang="css" name="Configuration">{source}</Code>
    <Code lang="html" name="HTML">{`<div class="${classes.join(' ')}">Example</div>`}</Code>
    <Code lang="css" name="Generated CSS" beautify>{configuredExampleCSS(source, classes)}</Code>
  </>
}
