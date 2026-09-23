import Code from 'internal/components/Code'
import React from 'react'
import { configuredExampleCSS, configuredExampleHTML, configuredMarkupClasses } from './configured-example'

type Props = { source: string } & ({ html: string; classes?: never } | { classes: string[]; html?: never; element?: 'div' | 'button'; label?: string })

export default function ConfiguredExample(props: Props) {
  const html = props.html ?? configuredExampleHTML(props.classes!, 'element' in props ? props.element : 'div', 'label' in props ? props.label : 'Example')
  const classes = props.classes ?? configuredMarkupClasses(html)
  return <>
    {props.source && <Code lang="css" name="Configuration">{props.source}</Code>}
    <Code lang="html" name="HTML">{html}</Code>
    <Code lang="css" name="Generated CSS" beautify>{configuredExampleCSS(props.source, classes)}</Code>
  </>
}
