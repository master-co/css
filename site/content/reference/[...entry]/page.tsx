import ReferencePage, { loadReferenceRoute, referenceMetadata } from '~/site/reference/ReferencePage'

type Props = { params: { locale: string; entry: string[] } }

export async function generateMetadata({ params }: Props) {
  const { entry, locale } = params
  return referenceMetadata(entry.join('/'), locale)
}

export default async function Page(props: Props) {
  const { entry } = props.params
  const doc = await loadReferenceRoute(entry.join('/'))
  return <ReferencePage {...props} document={doc} />
}
