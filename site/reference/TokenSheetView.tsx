import { Fragment } from 'react'
import Palette, { type PaletteGroup } from '../components/demo/foundations/Palette'
import { foundationTokens } from '../common/foundation-data/tokens'
import { modePair, pixels, type SheetGroup, type TokenSheet } from './sheets'
import { InlineText, keyWidth, Link, SheetClassTable, SheetExampleBlock, SheetHeading, SheetLinks, SheetNote, SheetTable, SheetValue } from './SheetBlocks'
import ReferenceIllustration from './ReferenceIllustration'

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
        : (row.cells ?? [row.value]).map((value, index) => {
          // A hue alias is a lookup relationship; do not hide its reference behind a hover title.
          const display = group.namespace === 'color' ? value : resolved(value)
          return <td key={index} title={display === value ? undefined : value}><SheetValue value={display} note={pixels(display)} /></td>
        })}
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
    {sheet.valuesLead && <p><InlineText>{sheet.valuesLead}</InlineText></p>}
    {sheet.groups.filter(group => group.values.length).map(group => <Fragment key={group.id}>
      {grouped && group.title && <h3 id={group.id}>{group.title}</h3>}
      {group.palette ? <PaletteView group={group} /> : <ValueTable group={group} width={width} />}
    </Fragment>)}

    {sheet.explanation && <>
      <SheetHeading id={sheet.explanation.id}>{sheet.explanation.title}</SheetHeading>
      <p><InlineText>{sheet.explanation.paragraphs[0]}</InlineText></p>
      <ReferenceIllustration id={sheet.explanation.illustration} />
      {sheet.explanation.paragraphs.slice(1).map(paragraph => <p key={paragraph}><InlineText>{paragraph}</InlineText></p>)}
      {!!sheet.explanation.links?.length && <SheetLinks>See {sheet.explanation.links.map((link, index) => <Fragment key={link.href}>{index ? ' and ' : ''}<Link href={link.href}>{link.label}</Link></Fragment>)}.</SheetLinks>}
    </>}

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
