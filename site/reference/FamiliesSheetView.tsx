import { Fragment } from 'react'
import { Link, SheetLinks, SheetTable } from './SheetBlocks'
import { ungroupedFamilies, type FamiliesSheet } from './sheets'

function FamilyTable({ rows }: { rows: { prefix: string, property: string }[] }) {
  return <SheetTable className="ref-family-table" head={['Prefix', 'Property']}>
    {rows.map((row, index) => <tr key={`${row.prefix} ${row.property}`} id={rows.findIndex(other => other.prefix === row.prefix) === index ? `family-${row.prefix}` : undefined}>
      <th scope="row"><code>{row.prefix}-</code></th>
      <td><code>{row.property}</code></td>
    </tr>)}
  </SheetTable>
}

/** Every prefix that reads a token, grouped by the page that lists its values. */
export default function FamiliesSheetView({ sheet }: { sheet: FamiliesSheet }) {
  const rest = ungroupedFamilies(sheet)
  return <>
    <p>Each prefix writes native properties from a token namespace, such as <code>p-md</code>. Write any other value as a native declaration, such as <code>(padding:1rem)</code>.</p>
    {sheet.groups.map(group => <section key={group.id} aria-labelledby={group.id}>
      <h2 id={group.id}>{group.pages.map(page => page.title).join(' and ')}</h2>
      <FamilyTable rows={group.rows} />
      <SheetLinks>Values in {group.pages.map((page, index) => <Fragment key={page.href}>{index ? ' and ' : ''}<Link href={page.href}>{page.title}</Link></Fragment>)}.</SheetLinks>
    </section>)}
    {rest.length > 0 && <>
      <h2 id="other">Other families</h2>
      <FamilyTable rows={rest.map(family => ({ prefix: family.prefix, property: family.property }))} />
    </>}
  </>
}
