import { createElement, Fragment } from 'react'
import { markdownTree } from '~/site/docs-shell/utils/markdown-tree'
import Link from '~/site/docs-shell/components/Link'
import Code from '~/site/docs-shell/components/Code'
import DocumentAPIIndex from '../components/DocumentAPIIndex'
import DocumentDeclaration from '../components/DocumentDeclaration'
import DocumentIdentifier from '../components/DocumentIdentifier'
import DocumentParameters from '../components/DocumentParameters'
import DocumentDisclosure from '../components/DocumentDisclosure'
import DocumentOptions from '../components/DocumentOptions'
import DocumentCodeExample from '../components/DocumentCodeExample'
import { documentHeadings } from './headings'
import { tokenValueEntry } from './value-entry'
import { DocumentCodeTable, DocumentKeyList, DocumentNamespaceTable, DocumentValueList, type DocumentValueRow } from '../components/DocumentValues'

/** Small, non-executing renderer for the normalized reference Markdown. */
export default function ReferenceMarkdown({ children, compactValues = false, introHeadingId }: { children: string, compactValues?: boolean, introHeadingId?: string }) {
  const headings = documentHeadings(children)
  let headingIndex = 0
  let entrypoint = ''
  const definitions = new Map<string, any>()
  const tree = markdownTree(children)
  for (const node of tree.children) if (node.type === 'definition') definitions.set(node.identifier, node)
  function render(node: any, key: number): React.ReactNode {
    const body = node.children?.map(render)
    const props = { key }
    switch (node.type) {
      case 'text': return node.value
      case 'paragraph': {
        const anchor = node.children.every((child: any) => child.type === 'html')
          && node.children.map((child: any) => child.value).join('').match(/^<a id="([\w-]+)"><\/a>$/)?.[1]
        if (anchor) return <span key={key} id={anchor} />
        const keys = node.children.filter((child: any) => child.type === 'inlineCode').map((child: any) => child.value)
        const onlyKeys = keys.length && keys.every((key: string) => key.endsWith(':'))
          && node.children.every((child: any) => child.type === 'inlineCode' || child.type === 'text' && /^[,\s]*$/.test(child.value))
        return compactValues && onlyKeys ? <DocumentKeyList key={key} keys={keys} /> : <p key={key}>{body}</p>
      }
      case 'strong': return <strong key={key}>{body}</strong>
      case 'emphasis': return <em key={key}>{body}</em>
      case 'delete': return <del key={key}>{body}</del>
      case 'inlineCode': return <code key={key}>{node.value}</code>
      case 'code': {
        if (node.lang === 'typescript' && node.meta === 'declaration') return <DocumentDeclaration key={key} label={`${entrypoint} — ${headings[headingIndex - 1]?.title ?? 'API'}`}>{node.value}</DocumentDeclaration>
        const disclosure = node.meta?.match(/\bdisclosure=(input-schema|output-schema|command-help)\b/)?.[1] as 'input-schema' | 'output-schema' | 'command-help' | undefined
        const titles = { 'input-schema': 'Complete input schema', 'output-schema': 'Complete output schema', 'command-help': 'Complete command help' }
        const code = <Code key={key} lang={node.lang || 'plaintext'} name={node.meta?.match(/name=(\S+)/)?.[1] || node.lang?.toUpperCase()} beautify={node.lang === 'css'} dedent={node.lang === 'sh' ? false : undefined}>{node.value}</Code>
        return disclosure ? <DocumentDisclosure key={key} title={titles[disclosure]}>{code}</DocumentDisclosure> : code
      }
      case 'heading': {
        if (node.depth === 2) entrypoint = node.children.map((child: any) => child.value ?? '').join('').replace(/\s+\{#[\w-]+\}$/, '')
        const heading = node.depth === 2 || node.depth === 3 ? headings[headingIndex++] : undefined
        if (heading && heading.id === introHeadingId) return <span key={key} id={heading.id} />
        const cleanBody = node.children.map((child: any, index: number) => render(child.type === 'text' ? { ...child, value: child.value.replace(/\s+\{#[\w-]+\}$/, '') } : child, index))
        return createElement(`h${node.depth}`, { ...props, id: heading?.id }, heading && /^(entry|api)-[0-9a-f]{12}$/.test(heading.id)
          ? <DocumentIdentifier>{heading.title}</DocumentIdentifier> : cleanBody)
      }
      case 'link': return <Link key={key} href={node.url}>{body}</Link>
      case 'linkReference': return <Link key={key} href={definitions.get(node.identifier)?.url}>{body}</Link>
      case 'list': return createElement(node.ordered ? 'ol' : 'ul', props, body)
      case 'listItem': return <li key={key}>{body}</li>
      case 'blockquote': return <blockquote key={key}>{body}</blockquote>
      case 'break': return <br key={key} />
      case 'thematicBreak': return <hr key={key} />
      case 'table': {
        const cells = node.children[0].children
        const apiIndex = cells.length === 2 && cells.every((cell: any) => cell.children.length === 1 && cell.children[0].type === 'text')
          && (cells[0].children[0].value === 'Import path' && cells[1].children[0].value === 'Purpose'
            || cells[0].children[0].value === 'Export' && cells[1].children[0].value === 'Kind')
          && node.children.slice(1).every((row: any) => row.children.length === 2 && row.children[0].children.length === 1
            && row.children[0].children[0].type === 'link' && row.children[0].children[0].children.length === 1
            && row.children[0].children[0].children[0].type === 'inlineCode'
            && row.children[1].children.length === 1 && row.children[1].children[0].type === 'text')
        if (apiIndex) {
          const compact = cells[0].children[0].value === 'Export'
          const entries = node.children.slice(1).map((row: any) => ({ name: row.children[0].children[0].children[0].value, href: row.children[0].children[0].url, description: row.children[1].children[0].value }))
          const index = <DocumentAPIIndex label={compact ? `${entrypoint} exports` : 'Public entrypoints'} entries={entries} compact={compact} />
          return compact ? <DocumentDisclosure key={key} title={`Exports · ${entries.length}`}>{index}</DocumentDisclosure> : <Fragment key={key}>{index}</Fragment>
        }
        if (cells.length === 3 && cells.every((cell: any, index: number) => cell.children.length === 1 && cell.children[0].value === ['Setting', 'Default', 'Effect'][index])
          && node.children.slice(1).every((row: any) => row.children.length === 3 && row.children.slice(0, 2).every((cell: any) => cell.children.length === 1 && cell.children[0].type === 'inlineCode'))) {
          return <DocumentOptions key={key} label="Project settings" options={node.children.slice(1).map((row: any) => ({
            name: row.children[0].children[0].value, defaultValue: row.children[1].children[0].value,
            description: row.children[2].children.map(render)
          }))} />
        }
        if (cells.length === 4 && cells.every((cell: any, index: number) => cell.children.length === 1 && cell.children[0].value === ['Parameter', 'Type', 'Requirement', 'Description'][index])
          && node.children.slice(1).every((row: any) => row.children.length === 4 && row.children.slice(0, 2).every((cell: any) => cell.children.length === 1 && cell.children[0].type === 'inlineCode') && row.children[2].children.length === 1 && row.children[2].children[0].type === 'text')) {
          return <DocumentParameters key={key} label="Parameters" parameters={node.children.slice(1).map((row: any) => ({
            name: row.children[0].children[0].value, type: row.children[1].children[0].value,
            requirement: row.children[2].children[0].value, description: row.children[3].children.map(render)
          }))} />
        }
        if (cells.length === 2 && ['Token', 'Syntax'].includes(cells[0].children[0]?.value) && cells[1].children[0]?.value === 'CSS'
          && node.children.slice(1).every((row: any) => row.children.length === 2 && row.children.every((cell: any) => cell.children.length === 1 && cell.children[0].type === 'inlineCode'))) {
          return <DocumentCodeTable key={key} label={cells[0].children[0].value} rows={node.children.slice(1).map((row: any) => ({ syntax: row.children[0].children[0].value, css: row.children[1].children[0].value }))} />
        }
        if (cells.length === 2 && cells[0].children[0]?.value === 'Namespace' && cells[1].children[0]?.value === 'Consumers'
          && node.children.slice(1).every((row: any) => row.children.length === 2 && row.children[0].children.length === 1 && row.children[0].children[0].type === 'inlineCode' && row.children[0].children[0].value.endsWith('-*')
            && row.children[1].children.every((child: any) => child.type === 'inlineCode' || child.type === 'text' && /^[,\s]*$/.test(child.value)))) {
          return <DocumentNamespaceTable key={key} rows={node.children.slice(1).map((row: any) => ({
            namespace: row.children[0].children[0].value.slice(0, -2),
            consumers: row.children[1].children.filter((child: any) => child.type === 'inlineCode').map((child: any) => child.value),
          }))} />
        }
        return <div key={key} className="doc-table"><table><thead><tr>{cells.map((cell: any, i: number) => <th key={i}>{cell.children.map(render)}</th>)}</tr></thead><tbody>{node.children.slice(1).map(render)}</tbody></table></div>
      }
      case 'tableRow': return <tr key={key}>{body}</tr>
      case 'tableCell': return <td key={key}>{body}</td>
      case 'html': {
        const id = node.value.match(/^<a id="([\w-]+)"><\/a>$/)?.[1]
        return id ? <span key={key} id={id} /> : null
      }
      case 'definition': return null
      default: return <Fragment key={key}>{body}</Fragment>
    }
  }
  if (!compactValues) {
    const content: React.ReactNode[] = []
    for (let index = 0; index < tree.children.length; index++) {
      const [title, source, result] = tree.children.slice(index, index + 3) as any[]
      if (title.type === 'paragraph' && title.children.length === 1 && title.children[0].type === 'strong'
        && title.children[0].children.every((child: any) => child.type === 'text')
        && source?.type === 'code' && source.lang === 'css' && source.meta === 'name=Source stylesheet=source'
        && result?.type === 'code' && result.lang === 'css' && result.meta === 'name=Result stylesheet=result') {
        content.push(<DocumentCodeExample key={index} title={title.children[0].children.map((child: any) => child.value).join('')} language="css" source={source.value} result={result.value} />)
        index += 2
      } else content.push(render(title, index))
    }
    return content
  }
  const content: React.ReactNode[] = []
  for (let index = 0; index < tree.children.length;) {
    const rows: DocumentValueRow[] = []
    const start = index
    while (index < tree.children.length) {
      const entry = tokenValueEntry(tree.children, index)
      if (!entry) break
      const heading = headings[headingIndex++]
      rows.push({ ...entry.row, id: heading.id, title: heading.title })
      index = entry.end
    }
    if (rows.length) content.push(<DocumentValueList key={start} rows={rows} />)
    else content.push(render(tree.children[index], index++))
  }
  return content
}
