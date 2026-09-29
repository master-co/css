import RetiredReferencePage, { retiredReferenceMetadata } from '~/site/components/RetiredReferencePage'

export const dynamic = 'force-static'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return retiredReferenceMetadata('background', (await params).locale)
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  return <RetiredReferencePage slug="background" locale={(await params).locale} />
}
