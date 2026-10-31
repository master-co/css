import ReferencePage, { loadReferenceRoute, referenceMetadata } from '~/site/reference/ReferencePage'
import RecipeSheetView from '~/site/reference/RecipeSheetView'

type Props = { params: { locale: string; entry: string } }

export async function generateMetadata({ params }: Props) {
  const { entry, locale } = params
  return referenceMetadata(entry, locale)
}

export default async function Page(props: Props) {
  const { entry } = props.params
  const doc = await loadReferenceRoute(entry, 'utility')
  if (doc.sheet?.kind !== 'recipe') throw new Error(`Missing recipe sheet: ${doc.id}`)
  return <ReferencePage {...props} document={doc} body={<RecipeSheetView sheet={doc.sheet} />} />
}
