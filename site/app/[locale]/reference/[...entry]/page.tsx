import { notFound } from 'next/navigation'
import Layout from '~/site/layouts/doc'
import dictionaries from '~/site/dictionaries'
import { routeIndex } from '~/site/reference/route-index'
import ReferenceMarkdown from '~/site/reference/ReferenceBody'
import { loadReferenceDocument } from '~/site/reference/load-document'

export const dynamic = 'force-static'
export const dynamicParams = false

export function generateStaticParams() {
  return routeIndex.map(doc => ({ entry: doc.id.split('/') }))
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; entry: string[] }> }) {
  const { entry, locale } = await params
  const doc = routeIndex.find(doc => doc.id === entry.join('/'))
  if (!doc) return {}
  return { title: doc.title, description: doc.description, alternates: { canonical: `${locale === 'tw' ? '/tw' : ''}${doc.url}` } }
}

export default async function Page(props: { params: Promise<{ locale: string; entry: string[] }> }) {
  const { entry } = await props.params
  const id = entry.join('/')
  if (!routeIndex.some(doc => doc.id === id)) notFound()
  const doc = await loadReferenceDocument(id)
  const introHeadingId = doc.kind === 'directive' ? doc.headings[0]?.id : undefined
  const specimenNamespace = doc.kind === 'tokens' ? doc.id.slice(7) : undefined
  const tokenSpecimen = specimenNamespace
    ? await import('~/site/reference/TokenSpecimens').then(({ default: TokenSpecimens }) => <TokenSpecimens namespace={specimenNamespace} />)
    : undefined
  const recipeSpecimen = doc.kind === 'utility'
    ? await import('~/site/reference/RecipeSpecimen').then(({ default: RecipeSpecimen }) => <RecipeSpecimen id={doc.id} />)
    : undefined
  return <Layout {...props} h1ClassName={doc.id.startsWith('tools/mcp/') ? 'reference-tool-title' : undefined} metadata={{ title: doc.title, description: doc.description, category: doc.category, pathname: doc.url, sourcePath: doc.source }} dictionaries={dictionaries} toc={doc.headings.filter(heading => heading.id !== introHeadingId && (!['tokens', 'package'].includes(doc.kind) || heading.depth === 2)).map(heading => ({ ...heading, level: heading.depth }))} pageCategories={[]}>
    <ReferenceMarkdown recipeSpecimen={recipeSpecimen} tokenSpecimen={tokenSpecimen} specimenNamespace={specimenNamespace} compactValues={doc.kind === 'tokens'} introHeadingId={introHeadingId}>{doc.markdown}</ReferenceMarkdown>
  </Layout>
}
