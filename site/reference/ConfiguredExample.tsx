import Code from '~/site/docs-shell/components/Code'
import React from 'react'
import GeneratedCSS from '../components/GeneratedCSS'
import { configuredExampleCSS, configuredExampleHTML, configuredMarkupClasses } from './configured-example'

type Props = { source: string } & ({ html: string; classes?: never } | { classes: string[]; html?: never; element?: 'div' | 'button'; label?: string })

export default function ConfiguredExample(props: Props) {
  const html = props.html ?? configuredExampleHTML(props.classes!, 'element' in props ? props.element : 'div', 'label' in props ? props.label : 'Example')
  const classes = props.classes ?? configuredMarkupClasses(html)
  return <>
    {props.source && <Code lang="css" beautify>{props.source}</Code>}
    <Code lang="html">{html}</Code>
    <GeneratedCSS><Code lang="css" beautify>{configuredExampleCSS(props.source, classes)}</Code></GeneratedCSS>
  </>
}
