import LegacySyntaxPage, { legacySyntaxMetadata } from '~/site/components/LegacySyntaxPage'


export async function generateMetadata({ params }: { params: { locale: string } }) {
  return legacySyntaxMetadata('conditional-queries', params.locale)
}

export default async function Page({ params }: { params: { locale: string } }) {
  return <LegacySyntaxPage slug="conditional-queries" locale={params.locale} />
}
