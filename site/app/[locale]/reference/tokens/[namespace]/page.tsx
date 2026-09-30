import ReferencePage, { loadReferenceRoute, referenceMetadata } from '~/site/reference/ReferencePage'
import TokenSpecimens from '~/site/reference/TokenSpecimens'
import { routeIndex } from '~/site/reference/route-index'

export const dynamic = 'force-static'
export const dynamicParams = false

type Props = { params: Promise<{ locale: string; namespace: string }> }

export function generateStaticParams() {
  return routeIndex.filter(doc => doc.kind === 'tokens').map(doc => ({ namespace: doc.id.slice('tokens/'.length) }))
}

export async function generateMetadata({ params }: Props) {
  const { namespace, locale } = await params
  return referenceMetadata(`tokens/${namespace}`, locale)
}

export default async function Page(props: Props) {
  const { namespace } = await props.params
  const doc = await loadReferenceRoute(`tokens/${namespace}`, 'tokens')
  return <ReferencePage {...props} document={doc} tokenSpecimen={<TokenSpecimens namespace={namespace} />} />
}
