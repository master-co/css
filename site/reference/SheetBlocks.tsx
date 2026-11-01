import '~/site/styles/system/data.css'
import '~/site/styles/reference-sheet.css'
import { createElement, Fragment } from 'react'
import clsx from 'clsx'
import Code from '~/site/docs-shell/components/Code'
import Link from '~/site/docs-shell/components/Link'
import DocumentDisclosure from '../components/DocumentDisclosure'
import GeneratedCSS from '../components/GeneratedCSS'
import type { SheetExample, SheetSyntax } from './sheets'

/** Backticks in short editorial sentences mark inline code. */
export function InlineText({ children }: { children: string }) {
  return children.split(/(`[^`]+`)/).map((part, index) => part.startsWith('`')
    ? <code key={index}>{part.slice(1, -1)}</code>
    : <Fragment key={index}>{part}</Fragment>)
}

function Placeholders({ children }: { children: string }) {
  return children.split(/(<[^>]+>)/).map((part, index) => part.startsWith('<')
    ? <var key={index}>{part}</var>
    : <Fragment key={index}>{part}</Fragment>)
}

export function SheetHeading({ id, children }: { id: string, children: React.ReactNode }) {
  return createElement('h2', { id }, children)
}

/**
 * Sheet tables are bare `.ui-table` children of the prose column, so they share the
 * document table treatment and bleed with code blocks and examples.
 */
export function SheetTable({ className, head, modes, keyWidth, children }: { className?: string, head: string[], modes?: boolean, keyWidth?: string, children: React.ReactNode }) {
  return <div className={clsx('ref-table ui-table', className)} data-modes={modes || undefined} style={keyWidth ? { '--ref-key-width': keyWidth } as React.CSSProperties : undefined}>
    <table>
      <thead><tr>{head.map(label => <th key={label} scope="col">{label}</th>)}</tr></thead>
      <tbody>{children}</tbody>
    </table>
  </div>
}

/** Class pattern → native declarations, the first fact a reader looks for. */
/** One width for every first column on a page, from its longest class: columns align down the page. */
export function keyWidth(names: string[]) {
  const longest = Math.max(...names.map(name => name.length))
  return `${Math.max(9.75, Math.min(17, longest * .5 + 1.25))}rem`
}

export function SheetClassTable({ rows, more, moreLabel, width }: { rows: SheetSyntax[], more?: SheetSyntax[], moreLabel?: string, width?: string }) {
  const table = (rows: SheetSyntax[], width?: string) => <SheetTable className="ref-class-table" head={['Class', 'Declarations']} keyWidth={width}>
    {rows.map(row => <tr key={row.syntax}>
      <th scope="row">
        {row.prefix
          ? <Link href={`/reference/tokens/families#family-${row.prefix}`}><code><Placeholders>{row.syntax}</Placeholders></code></Link>
          : <code><Placeholders>{row.syntax}</Placeholders></code>}
      </th>
      <td><span className="ref-declarations">{row.declarations.split('\n').map((line, index) => {
        const separator = line.indexOf(':')
        return <span key={index} className="ref-declaration">
          <span className="ref-property">{line.slice(0, separator)}:</span> <span className="ref-declaration-value"><Placeholders>{line.slice(separator + 1).trim().replace(/;$/, '')}</Placeholders>;</span>
        </span>
      })}</span></td>
    </tr>)}
  </SheetTable>
  return <>
    {table(rows, width)}
    {/* The disclosed rows size their own column; they never join the page's alignment. */}
    {!!more?.length && <DocumentDisclosure title={moreLabel ?? `${more.length} more classes`}>{table(more, keyWidth(more.map(row => row.syntax)))}</DocumentDisclosure>}
  </>
}

/**
 * Lead sentence, then one tray: the live preview on its stage, the subject's source and its
 * closed Generated CSS, so the preview and the code read as one example.
 */
export function SheetExampleBlock({ example, preview = true, source = true, caption }: { example: SheetExample, preview?: boolean, source?: boolean, caption?: string }) {
  return <>
    {example.lead && <p><InlineText>{example.lead}</InlineText></p>}
    <figure className="ui-tray">
      {preview && <div className="ui-stage">
        <div className="ref-example-scene" dangerouslySetInnerHTML={{ __html: example.html }} />
      </div>}
      {!preview && example.configuration && <Code lang="css">{example.configuration}</Code>}
      {source && <Code lang="html">{example.code}</Code>}
      <GeneratedCSS><Code lang="css" beautify>{example.css}</Code></GeneratedCSS>
      {caption && <figcaption className="ui-tray-caption"><InlineText>{caption}</InlineText></figcaption>}
    </figure>
  </>
}

export function SheetLinks({ children }: { children: React.ReactNode }) {
  return <p className="ref-links">{children}</p>
}

/** A Master-specific rule placed right after the classes it governs. */
export function SheetNote({ children }: { children: string }) {
  return <p className="ref-note"><InlineText>{children}</InlineText></p>
}

/** One line per value: a long layered value collapses and opens in place. */
export function SheetValue({ value, note }: { value: string, note?: string }) {
  if (value.length > 64) return <details className="ref-long-value" suppressHydrationWarning>
    <summary><code>{value}</code></summary>
    <code>{value}</code>
  </details>
  return <>
    <code>{value}</code>
    {note && <span className="ref-value-note">{note}</span>}
  </>
}

export { Link }
