import LegacySyntaxRedirect from './LegacySyntaxRedirect'
import { legacySyntaxPages, localizeSyntaxURL, type LegacySyntaxSlug } from '../utils/legacy-syntax'

export function legacySyntaxMetadata(slug: LegacySyntaxSlug, locale: string) {
  return {
    title: 'Syntax Tutorial',
    robots: { index: false, follow: true },
    alternates: { canonical: localizeSyntaxURL(legacySyntaxPages[slug].tutorial.split('#')[0], locale === 'tw' ? 'tw' : '') }
  }
}

export default function LegacySyntaxPage({ slug, locale }: { slug: LegacySyntaxSlug; locale: string }) {
  const page = legacySyntaxPages[slug]
  const tw = locale === 'tw'
  return <main className="prose flex:1 px:xl pb:xl pt:5xl">
    <LegacySyntaxRedirect slug={slug} locale={locale} />
    <h1>{tw ? '語法教學已整合' : 'The syntax guides have moved'}</h1>
    <p>{tw ? '繼續閱讀完整教學，或查閱正式規則。' : 'Continue with the complete tutorial, or look up the formal rules.'}</p>
    <p><a href={localizeSyntaxURL(page.tutorial, locale)}>Syntax Tutorial</a> · <a href={localizeSyntaxURL(page.reference, locale)}>Reference</a></p>
  </main>
}
