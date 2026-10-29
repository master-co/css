import ReferencePage, { loadReferenceRoute, referenceMetadata } from '~/site/reference/ReferencePage'
import TokenSpecimens from '~/site/reference/TokenSpecimens'

type Props = { params: { locale: string; namespace: string } }

export async function generateMetadata({ params }: Props) {
  const { namespace, locale } = params
  return referenceMetadata(`tokens/${namespace}`, locale)
}

export default async function Page(props: Props) {
  const { namespace } = props.params
  const doc = await loadReferenceRoute(`tokens/${namespace}`, 'tokens')
  return <ReferencePage {...props} document={doc} tokenSpecimen={<TokenSpecimens namespace={namespace} />} />
}
