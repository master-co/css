import LegacySyntaxPage, { legacySyntaxMetadata } from '~/site/components/LegacySyntaxPage'


export async function generateMetadata({ params }: { params: { locale: string } }) {
  return legacySyntaxMetadata('state-selectors', params.locale)
}

export default async function Page({ params }: { params: { locale: string } }) {
  return <LegacySyntaxPage slug="state-selectors" locale={params.locale} />
}
