import ReferencePage, { loadReferenceRoute, referenceMetadata } from '~/site/reference/ReferencePage'
import RecipeSpecimen from '~/site/reference/RecipeSpecimen'
import { routeIndex } from '~/site/reference/route-index'


type Props = { params: { locale: string; entry: string } }

export function generateStaticParams() {
  return routeIndex.filter(doc => doc.kind === 'utility').map(doc => ({ entry: doc.id }))
}

export async function generateMetadata({ params }: Props) {
  const { entry, locale } = params
  return referenceMetadata(entry, locale)
}

export default async function Page(props: Props) {
  const { entry } = props.params
  const doc = await loadReferenceRoute(entry, 'utility')
  return <ReferencePage {...props} document={doc} recipeSpecimen={<RecipeSpecimen id={doc.id} />} />
}
