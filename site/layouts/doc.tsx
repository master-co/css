import Layout from 'internal/layouts/doc'
import { footerProps } from '~/site/navigation'
import catalogJSON from '~/site/.generated/reference.json'
import DocumentMeta from '~/site/reference/DocumentMeta'
import type { ReferenceCatalog } from '~/site/reference/types'

export default async function SiteDocLayout(props: any) {
  const catalog = catalogJSON as ReferenceCatalog
  const doc = catalog.documents.find(doc => doc.url === props.metadata.pathname)
  const { locale } = await props.params
  return <Layout {...props} className={props.metadata.pathname?.startsWith('/reference') ? 'reference-document' : props.className} footerProps={footerProps}>
    {doc && <DocumentMeta doc={doc} catalog={catalog} locale={locale} />}
    {props.children}
    {doc && <DocumentMeta doc={doc} catalog={catalog} locale={locale} related />}
  </Layout>
}
