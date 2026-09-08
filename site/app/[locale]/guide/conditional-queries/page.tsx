import LegacySyntaxPage, { legacySyntaxMetadata } from '~/site/components/LegacySyntaxPage'

export const dynamic = 'force-static'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return legacySyntaxMetadata('conditional-queries', (await params).locale)
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  return <LegacySyntaxPage slug="conditional-queries" locale={(await params).locale} />
}
