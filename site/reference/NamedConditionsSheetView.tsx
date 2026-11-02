import { Fragment } from 'react'
import { InlineText, Link, SheetExampleBlock, SheetHeading, SheetLinks, SheetTable } from './SheetBlocks'
import { namedConditionText } from './named-conditions'
import ReferenceIllustration from './ReferenceIllustration'
import type { NamedConditionsSheet } from './sheets'

export default function NamedConditionsSheetView({ sheet }: { sheet: NamedConditionsSheet }) {
  return <>
    <p><InlineText>{namedConditionText.intro}</InlineText></p>
    <SheetHeading id="conditions">Media conditions</SheetHeading>
    <p><InlineText>{namedConditionText.media}</InlineText></p>
    {sheet.groups.map((group, index) => <Fragment key={group.id}>
      {index === 3 && <>
        <SheetHeading id="container-conditions">Container conditions</SheetHeading>
        <p><InlineText>{namedConditionText.container}</InlineText></p>
      </>}
      <h3 id={group.id}>{group.title}</h3>
      <SheetTable className="ref-value-table" head={['Suffix', 'Expanded query']}>
        {group.rows.map(row => <tr key={row.id} id={row.id}>
          <th scope="row"><code>{row.suffix}</code></th>
          <td><code>{row.query}</code></td>
        </tr>)}
      </SheetTable>
    </Fragment>)}
    <p><InlineText>{namedConditionText.complement}</InlineText></p>
    <SheetHeading id="scope">Same name, different scope</SheetHeading>
    <p><InlineText>{namedConditionText.scope}</InlineText></p>
    <ReferenceIllustration id="condition-domains" />
    <SheetHeading id="usage">Usage</SheetHeading>
    <SheetExampleBlock example={sheet.usage} />
    <SheetHeading id="customize">Customize</SheetHeading>
    <p><InlineText>{namedConditionText.customize}</InlineText></p>
    <SheetExampleBlock example={sheet.customize} preview={false} />
    <SheetLinks>See <Link href="/reference/rules/conditions">condition grammar</Link>, <Link href="/reference/rules/conditions#compiled-condition-definitions">condition definition scope</Link>, <Link href="/reference/directives/queries#custom-container">query definitions</Link>, <Link href="/reference/tokens/container">container sizing tokens</Link> and <Link href="/guide/responsive-design">Responsive design</Link>.</SheetLinks>
  </>
}
