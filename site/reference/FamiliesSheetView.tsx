import { Fragment } from 'react'
import { InlineText, Link, SheetExampleBlock, SheetLinks, SheetTable } from './SheetBlocks'
import { familyText } from './family-editorial'
import ReferenceIllustration from './ReferenceIllustration'
import { ungroupedFamilies, type FamiliesSheet, type FamilyRow } from './sheets'

function FamilyTable({ rows }: { rows: FamilyRow[] }) {
  return <SheetTable className="ref-family-table" head={['Prefix', 'Token namespace', 'Properties']} keyWidth="5.5rem">
    {rows.map((row, index) => <tr key={`${row.prefix} ${row.namespace}`} id={rows.findIndex(other => other.prefix === row.prefix) === index ? `family-${row.prefix}` : undefined}>
      <th scope="row"><code>{row.prefix}-</code></th>
      <td><code>--{row.namespace}-*</code></td>
      <td><code>{row.property}</code></td>
    </tr>)}
  </SheetTable>
}

/** Every prefix that reads a token, grouped by the page that lists its values. */
export default function FamiliesSheetView({ sheet }: { sheet: FamiliesSheet }) {
  const rest = ungroupedFamilies(sheet)
  return <>
    <p><InlineText>{familyText.intro}</InlineText></p>
    <h2 id="reading-a-family">Read a family</h2>
    <p><InlineText>{familyText.mapping}</InlineText></p>
    <ReferenceIllustration id="namespace-lookup" />
    <SheetExampleBlock example={sheet.usage} preview={false} />
    <p><InlineText>{familyText.lookup}</InlineText></p>
    {sheet.groups.map(group => <Fragment key={group.id}>
      <h2 id={group.id}>{group.pages.map(page => page.title).join(' and ')}</h2>
      <FamilyTable rows={group.rows} />
      <SheetLinks>Values in {group.pages.map((page, index) => <Fragment key={page.href}>{index ? ' and ' : ''}<Link href={page.href}>{page.title}</Link></Fragment>)}.</SheetLinks>
    </Fragment>)}
    {rest.length > 0 && <>
      <h2 id="other">Other families</h2>
      <FamilyTable rows={rest.toSorted((a, b) => a.prefix.length - b.prefix.length || a.prefix.localeCompare(b.prefix))} />
    </>}
    <h2 id="resolution-boundaries">Resolution boundaries</h2>
    {[familyText.shared, familyText.registration, familyText.roles, familyText.limits].map(paragraph => <p key={paragraph}><InlineText>{paragraph}</InlineText></p>)}
    <SheetLinks>See <Link href="/reference/rules/modes#namespace-resolution">token registration and resolution</Link>, <Link href="/reference/directives/definitions#utilities">utility definitions</Link>, <Link href="/reference/rules/declarations">declaration forms</Link> and <Link href="/guide/theme#define-tokens">building a theme</Link>.</SheetLinks>
  </>
}
