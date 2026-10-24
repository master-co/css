import LegacySyntaxPage, { legacySyntaxMetadata } from '~/site/components/LegacySyntaxPage'


export async function generateMetadata({ params }: { params: { locale: string } }) {
  return legacySyntaxMetadata('style-declarations', params.locale)
}

export default async function Page({ params }: { params: { locale: string } }) {
  return <LegacySyntaxPage slug="style-declarations" locale={params.locale} />
}
