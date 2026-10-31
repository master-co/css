import { Link, SheetExampleBlock, SheetHeading, SheetLinks, SheetTable } from './SheetBlocks'
import type { BreakpointsSheet } from './sheets'

export default function BreakpointsSheetView({ sheet }: { sheet: BreakpointsSheet }) {
  return <>
    <SheetHeading id="conditions">Conditions</SheetHeading>
    <p>Append a condition to any class with <code>@</code>, such as <code>grid-cols(3)@md</code>. These are preset <code>@custom-media</code> definitions, not theme variables.</p>
    {sheet.groups.map(group => <section key={group.id} aria-labelledby={group.id}>
      <h3 id={group.id}>{group.title}</h3>
      <SheetTable className="ref-value-table" head={['Condition', 'Query']}>
        {group.rows.map(row => <tr key={row.name} id={`condition-${row.name}`}>
          <th scope="row"><code>@{row.name}</code></th>
          <td><code>{row.query}</code>{row.pixels && <span className="ref-value-note">{row.pixels}</span>}</td>
        </tr>)}
      </SheetTable>
    </section>)}

    <SheetHeading id="usage">Usage</SheetHeading>
    <SheetExampleBlock example={sheet.usage} />

    <SheetHeading id="customize">Customize</SheetHeading>
    <SheetExampleBlock example={sheet.customize} preview={false} />
    <SheetLinks>See <Link href="/reference/rules/conditions">conditions</Link> and <Link href="/guide/responsive-design#based-on-viewport-breakpoints">Responsive design</Link>.</SheetLinks>
  </>
}
