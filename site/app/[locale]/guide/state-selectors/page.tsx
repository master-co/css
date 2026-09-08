import LegacySyntaxPage, { legacySyntaxMetadata } from '~/site/components/LegacySyntaxPage'

export const dynamic = 'force-static'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return legacySyntaxMetadata('state-selectors', (await params).locale)
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  return <LegacySyntaxPage slug="state-selectors" locale={(await params).locale} />
}
