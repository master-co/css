import { notFound } from 'next/navigation'
import Layout from '~/site/layouts/doc'
import dictionaries from '~/site/dictionaries'
import catalogJSON from '~/site/.generated/reference.json'
import ReferenceMarkdown from '~/site/reference/ReferenceBody'
import type { ReferenceCatalog } from '~/site/reference/types'

const catalog = catalogJSON as ReferenceCatalog
export const dynamic = 'force-static'
export const dynamicParams = false

export function generateStaticParams() {
  return catalog.documents.filter(doc => doc.kind !== 'utility').map(doc => ({ entry: doc.id.split('/') }))
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; entry: string[] }> }) {
  const { entry, locale } = await params
  const doc = catalog.documents.find(doc => doc.id === entry.join('/'))
  if (!doc) return {}
  return { title: doc.title, description: doc.description, alternates: { canonical: `${locale === 'tw' ? '/tw' : ''}${doc.url}` } }
}

export default async function Page(props: { params: Promise<{ locale: string; entry: string[] }> }) {
  const { entry } = await props.params
  const doc = catalog.documents.find(doc => doc.id === entry.join('/'))
  if (!doc) notFound()
  return <Layout {...props} metadata={{ title: doc.title, description: doc.description, category: doc.category, pathname: doc.url, sourcePath: doc.source }} dictionaries={dictionaries} toc={doc.headings.filter(heading => doc.kind !== 'tokens' || heading.depth === 2).map(heading => ({ ...heading, level: heading.depth }))} pageCategories={[]}>
    <ReferenceMarkdown>{doc.markdown}</ReferenceMarkdown>
  </Layout>
}
