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
  if (!routeIndex.some(doc => doc.id === id && (!kind || doc.kind === kind))) throw new Error(`Unknown reference route ${id}`)
  return loadReferenceDocument(id)
}

/** Route entries choose their body view; the shared shell imports no view graph. */
export default function ReferencePage({ document: doc, body, ...props }: {
  document: ReferenceRenderDocument
  params: { locale: string }
  /** A structured sheet view replaces the Markdown renderer. */
  body?: React.ReactNode
}) {
  const toc = doc.headings.filter(heading => doc.kind !== 'package' || heading.depth === 2).map(heading => ({ ...heading, level: heading.depth }))
  return <Layout {...props} metadata={{ title: doc.title, description: doc.description, category: doc.category, pathname: doc.url, sourcePath: doc.source }} dictionaries={dictionaries} toc={toc} pageCategories={[]}>
    {body ?? <ReferenceMarkdown tree={doc.tree} headings={doc.headings} />}
  </Layout>
}
