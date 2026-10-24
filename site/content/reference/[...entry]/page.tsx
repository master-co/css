import ReferencePage, { loadReferenceRoute, referenceMetadata } from '~/site/reference/ReferencePage'
import { routeIndex } from '~/site/reference/route-index'


type Props = { params: { locale: string; entry: string[] } }

export function generateStaticParams() {
  return routeIndex.filter(doc => doc.kind !== 'tokens' && doc.kind !== 'utility').map(doc => ({ entry: doc.id.split('/') }))
}

export async function generateMetadata({ params }: Props) {
  const { entry, locale } = params
  return referenceMetadata(entry.join('/'), locale)
}

export default async function Page(props: Props) {
  const { entry } = props.params
  const doc = await loadReferenceRoute(entry.join('/'))
  return <ReferencePage {...props} document={doc} />
}
