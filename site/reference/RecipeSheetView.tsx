import Code from '~/site/docs-shell/components/Code'
import DocumentDisclosure from '../components/DocumentDisclosure'
import { keyWidth, Link, SheetClassTable, SheetExampleBlock, SheetHeading, SheetLinks, SheetNote } from './SheetBlocks'
import type { RecipeSheet } from './sheets'

export default function RecipeSheetView({ sheet }: { sheet: RecipeSheet }) {
  const definitions = sheet.definitions.split('\n\n')
  return <>
    <SheetHeading id="overview">Classes</SheetHeading>
    <SheetClassTable rows={sheet.syntax} more={sheet.more} moreLabel={`${sheet.more.length} more functions`} width={keyWidth(sheet.syntax.map(row => row.syntax))} />
    {sheet.note && <SheetNote>{sheet.note}</SheetNote>}

    <SheetHeading id="examples">Example</SheetHeading>
    <SheetExampleBlock example={sheet.usage} caption={sheet.caption} />

    <SheetHeading id="customize">Customize</SheetHeading>
    <p>The preset defines {sheet.syntax.length + sheet.more.length > 1 ? 'these classes' : 'this class'} with <code>@utility</code>. Define the same name in your stylesheet to replace it.</p>
    {definitions.length > 4
      ? <>
        <Code lang="css">{definitions[0]}</Code>
        <DocumentDisclosure title={`All ${definitions.length} definitions`}><Code lang="css">{sheet.definitions}</Code></DocumentDisclosure>
      </>
      : <Code lang="css">{sheet.definitions}</Code>}
    <SheetLinks>
      See <Link href="/reference/directives/definitions">utility definitions</Link>
      {sheet.guide && <> and <Link href={sheet.guide.href}>{sheet.guide.label}</Link></>}.
    </SheetLinks>
  </>
}
