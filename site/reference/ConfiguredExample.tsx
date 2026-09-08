import Code from 'internal/components/Code'
import React from 'react'
import { configuredExampleCSS, configuredExampleHTML } from './configured-example'

export default function ConfiguredExample({ source, classes, element = 'div', label = 'Example' }: { source: string; classes: string[]; element?: 'div' | 'button'; label?: string }) {
  return <>
    <Code lang="css" name="Configuration">{source}</Code>
    <Code lang="html" name="HTML">{configuredExampleHTML(classes, element, label)}</Code>
    <Code lang="css" name="Generated CSS" beautify>{configuredExampleCSS(source, classes)}</Code>
  </>
}
