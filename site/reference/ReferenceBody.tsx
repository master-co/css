import { createElement, Fragment } from 'react'
import { markdownTree } from 'internal/utils/markdown-tree'
import Link from 'internal/components/Link'
import Code from 'internal/components/Code'
import { documentHeadings } from './headings'

/** Small, non-executing renderer for the normalized reference Markdown. */
export default function ReferenceMarkdown({ children }: { children: string }) {
  const headings = documentHeadings(children)
  let headingIndex = 0
  const definitions = new Map<string, any>()
  const tree = markdownTree(children)
  for (const node of tree.children) if (node.type === 'definition') definitions.set(node.identifier, node)
  function render(node: any, key: number): React.ReactNode {
    const body = node.children?.map(render)
    const props = { key }
    switch (node.type) {
      case 'text': return node.value
      case 'paragraph': return <p {...props}>{body}</p>
      case 'strong': return <strong {...props}>{body}</strong>
      case 'emphasis': return <em {...props}>{body}</em>
      case 'delete': return <del {...props}>{body}</del>
      case 'inlineCode': return <code {...props}>{node.value}</code>
      case 'code': return <Code {...props} lang={node.lang || 'plaintext'} name={node.meta?.match(/name=(\S+)/)?.[1] || node.lang?.toUpperCase()} beautify={node.lang === 'css'}>{node.value}</Code>
      case 'heading': {
        const heading = node.depth === 2 || node.depth === 3 ? headings[headingIndex++] : undefined
        const cleanBody = node.children.map((child: any, index: number) => render(child.type === 'text' ? { ...child, value: child.value.replace(/\s+\{#[\w-]+\}$/, '') } : child, index))
        return createElement(`h${node.depth}`, { ...props, id: heading?.id }, cleanBody)
      }
      case 'link': return <Link {...props} href={node.url}>{body}</Link>
      case 'linkReference': return <Link {...props} href={definitions.get(node.identifier)?.url}>{body}</Link>
      case 'list': return createElement(node.ordered ? 'ol' : 'ul', props, body)
      case 'listItem': return <li {...props}>{body}</li>
      case 'blockquote': return <blockquote {...props}>{body}</blockquote>
      case 'break': return <br {...props} />
      case 'thematicBreak': return <hr {...props} />
      case 'table': return <div {...props} className="doc-table"><table><thead><tr>{node.children[0].children.map((cell: any, i: number) => <th key={i}>{cell.children.map(render)}</th>)}</tr></thead><tbody>{node.children.slice(1).map(render)}</tbody></table></div>
      case 'tableRow': return <tr {...props}>{body}</tr>
      case 'tableCell': return <td {...props}>{body}</td>
      case 'html': {
        const id = node.value.match(/^<a id="([\w-]+)"><\/a>$/)?.[1]
        return id ? <span {...props} id={id} /> : null
      }
      case 'definition': return null
      default: return <Fragment {...props}>{body}</Fragment>
    }
  }
  return tree.children.map(render)
}
