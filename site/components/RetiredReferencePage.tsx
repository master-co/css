import { retiredReferenceDestination, type RetiredReferenceSlug } from '../utils/retired-reference'

export function retiredReferenceMetadata(slug: RetiredReferenceSlug, locale: string) {
  return {
    title: 'Reference moved',
    robots: { index: false, follow: true },
    alternates: { canonical: retiredReferenceDestination(slug, locale === 'tw' ? 'tw' : '') }
  }
}

export default function RetiredReferencePage({ slug, locale }: { slug: RetiredReferenceSlug; locale: string }) {
  const destination = retiredReferenceDestination(slug, locale)
  return <main className="px-xl py-xl prose">
    <meta httpEquiv="refresh" content={`0;url=${destination}`} />
    <h1>{locale === 'tw' ? '參考文件已移動' : 'This reference has moved'}</h1>
    <p><a href={destination}>{locale === 'tw' ? '繼續閱讀' : 'Continue to the reference'}</a></p>
  </main>
}
