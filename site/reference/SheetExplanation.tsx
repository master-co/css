import { Fragment } from 'react'
import { InlineText, Link, SheetHeading, SheetLinks } from './SheetBlocks'
import ReferenceIllustration from './ReferenceIllustration'
import type { TokenPageEditorial } from './sheet-editorial'

export default function SheetExplanation({ explanation }: { explanation: TokenPageEditorial['explanation'] }) {
  if (!explanation) return null
  return <>
    <SheetHeading id={explanation.id}>{explanation.title}</SheetHeading>
    <p><InlineText>{explanation.paragraphs[0]}</InlineText></p>
    <ReferenceIllustration id={explanation.illustration} />
    {explanation.paragraphs.slice(1).map(paragraph => <p key={paragraph}><InlineText>{paragraph}</InlineText></p>)}
    {!!explanation.links?.length && <SheetLinks>See {explanation.links.map((link, index) => <Fragment key={link.href}>{index ? ' and ' : ''}<Link href={link.href}>{link.label}</Link></Fragment>)}.</SheetLinks>}
  </>
}
