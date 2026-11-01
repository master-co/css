import { Fragment } from 'react'
import Palette, { type PaletteGroup } from '../components/demo/foundations/Palette'
import { foundationTokens } from '../common/foundation-data/tokens'
import { modePair, pixels, type SheetGroup, type TokenSheet } from './sheets'
import { keyWidth, Link, SheetClassTable, SheetExampleBlock, SheetHeading, SheetLinks, SheetNote, SheetTable, SheetValue } from './SheetBlocks'

/** Show a stored `var(--token)` reference as the value it resolves to, e.g. text sizes. */
function resolved(value: string) {
  const name = value.match(/^var\(--([\w-]+)\)$/)?.[1]
  return (name && foundationTokens.find(token => token.name === name)?.values[0].value) || value
}

function ValueTable({ group, width }: { group: SheetGroup, width: string }) {
  const modes = group.head.includes('Light')
  return <SheetTable className="ref-value-table" head={group.head} modes={modes} keyWidth={width}>
    {group.values.map(row => <tr key={row.id} id={row.id}>
      <th scope="row"><code>{row.className}</code></th>
      {modes ? modePair(row.value)!.map((value, index) => <td key={index}><code>{value}</code></td>)
        : (row.cells ?? [row.value]).map((value, index) => <td key={index} title={resolved(value) === value ? undefined : value}><SheetValue value={resolved(value)} note={pixels(resolved(value))} /></td>)}
    </tr>)}
  </SheetTable>
}

/** Numbered steps read best as a hue × step matrix; every swatch copies its value. */
function PaletteView({ group }: { group: SheetGroup }) {
  const hues = new Map<string, PaletteGroup>()
  for (const row of group.values) {
    const [, family, step] = row.key.match(/^(.+)-(\d+)$/)!
    if (!hues.has(family)) hues.set(family, { family, colors: [] })
    hues.get(family)!.colors.push({ name: row.variable.slice(2), step: Number(step), value: row.value })
  }
  return <div className="ui-tray">
    <div className="ui-stage" data-padding="sm" data-align="start">
      <Palette groups={[...hues.values()].map(hue => ({ ...hue, colors: hue.colors.sort((a, b) => a.step - b.step) }))} />
    </div>
  </div>
}

export default function TokenSheetView({ sheet }: { sheet: TokenSheet }) {
  const grouped = sheet.groups.length > 1
  const width = keyWidth(sheet.syntax.map(row => row.syntax).concat(sheet.groups.flatMap(group => group.values.map(value => value.className))))
  return <>
    <SheetHeading id="consumers">Classes</SheetHeading>
    <SheetClassTable rows={sheet.syntax} more={sheet.more} moreLabel={sheet.id.startsWith('color') ? `${sheet.more.length} other color families` : `${sheet.more.length} more classes`} width={width} />
    {sheet.note && <SheetNote>{sheet.note}</SheetNote>}

    <SheetHeading id="values">Values</SheetHeading>
    {sheet.groups.filter(group => group.values.length).map(group => <Fragment key={group.id}>
      {grouped && group.title && <h3 id={group.id}>{group.title}</h3>}
      {group.palette ? <PaletteView group={group} /> : <ValueTable group={group} width={width} />}
    </Fragment>)}

    <SheetHeading id="usage">Usage</SheetHeading>
    <SheetExampleBlock example={sheet.usage} />

    <SheetHeading id="customize">Customize</SheetHeading>
    <SheetExampleBlock example={sheet.customize} preview={false} source={false} />
    <SheetLinks>
      See <Link href="/reference/directives/theme">theme directives</Link>
      {sheet.guide && <> and <Link href={sheet.guide.href}>{sheet.guide.label}</Link></>}.
    </SheetLinks>
  </>
}
