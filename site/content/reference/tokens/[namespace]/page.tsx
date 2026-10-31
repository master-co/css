import ReferencePage, { loadReferenceRoute, referenceMetadata } from '~/site/reference/ReferencePage'
import TokenSheetView from '~/site/reference/TokenSheetView'
import FamiliesSheetView from '~/site/reference/FamiliesSheetView'
import BreakpointsSheetView from '~/site/reference/BreakpointsSheetView'

type Props = { params: { locale: string; namespace: string } }

export async function generateMetadata({ params }: Props) {
  const { namespace, locale } = params
  return referenceMetadata(`tokens/${namespace}`, locale)
}

export default async function Page(props: Props) {
  const { namespace } = props.params
  const doc = await loadReferenceRoute(`tokens/${namespace}`, 'tokens')
  const sheet = doc.sheet
  const body = sheet?.kind === 'tokens' ? <TokenSheetView sheet={sheet} />
    : sheet?.kind === 'families' ? <FamiliesSheetView sheet={sheet} />
      : sheet?.kind === 'breakpoints' ? <BreakpointsSheetView sheet={sheet} /> : undefined
  if (!body) throw new Error(`Missing token sheet: ${doc.id}`)
  return <ReferencePage {...props} document={doc} body={body} />
}
