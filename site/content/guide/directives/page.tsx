import LegacySyntaxPage, { legacySyntaxMetadata } from '~/site/components/LegacySyntaxPage'


export async function generateMetadata({ params }: { params: { locale: string } }) {
  return legacySyntaxMetadata('directives', params.locale)
}

export default async function Page({ params }: { params: { locale: string } }) {
  return <LegacySyntaxPage slug="directives" locale={params.locale} />
}
