import { notFound } from 'next/navigation'
import Layout from '~/site/layouts/doc'
import dictionaries from '~/site/dictionaries'
import ReferenceMarkdown from './ReferenceBody'
import { routeIndex } from './route-index'
import { loadReferenceDocument } from './load-document'
import type { ReferenceRenderDocument } from './render-document'
import type { ReferenceDocument } from './types'

export function referenceMetadata(id: string, locale: string) {
  const doc = routeIndex.find(doc => doc.id === id)
  if (!doc) return {}
  return { title: doc.title, description: doc.description, alternates: { canonical: `${locale === 'tw' ? '/tw' : ''}${doc.url}` } }
}

export async function loadReferenceRoute(id: string, kind?: ReferenceDocument['kind']) {
  if (!routeIndex.some(doc => doc.id === id && (!kind || doc.kind === kind))) notFound()
  return loadReferenceDocument(id)
}

/** Route entries choose their specimen; the shared shell imports no specimen graph. */
export default function ReferencePage({ document: doc, recipeSpecimen, tokenSpecimen, ...props }: {
  document: ReferenceRenderDocument
  params: Promise<{ locale: string }>
  recipeSpecimen?: React.ReactNode
  tokenSpecimen?: React.ReactNode
}) {
  const introHeadingId = doc.kind === 'directive' ? doc.headings[0]?.id : undefined
  const specimenNamespace = doc.kind === 'tokens' ? doc.id.slice(7) : undefined
  return <Layout {...props} h1ClassName={doc.id.startsWith('tools/mcp/') ? 'reference-tool-title' : undefined} metadata={{ title: doc.title, description: doc.description, category: doc.category, pathname: doc.url, sourcePath: doc.source }} dictionaries={dictionaries} toc={doc.headings.filter(heading => heading.id !== introHeadingId && (!['tokens', 'package'].includes(doc.kind) || heading.depth === 2)).map(heading => ({ ...heading, level: heading.depth }))} pageCategories={[]}>
    <ReferenceMarkdown tree={doc.tree} headings={doc.headings} recipeSpecimen={recipeSpecimen} tokenSpecimen={tokenSpecimen} specimenNamespace={specimenNamespace} compactValues={doc.kind === 'tokens'} introHeadingId={introHeadingId} />
  </Layout>
}
