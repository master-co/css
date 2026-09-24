import ArticleHeader from '../components/ArticleHeader'
import PageNavs from '../components/PageNavs'
import DocMain from '../components/DocMain'
import PageContent from '../components/PageContent'
import PageContentBootstrap from '../components/PageContentBootstrap'
import PageContentBlockMap from '../components/PageContentBlockMap'
import { PageContentProvider } from '../components/PageContentContext'
import DocArticle from '../components/DocArticle'

export default async function DocLayout({ children, params, searchParams, toc, pageCategories, metadata, dictionaries, footerProps, ...props }: any) {
  const { locale } = await params
  const pageContent = Array.isArray(toc) && toc.length > 0 ? toc : null
  const article = (
    <DocArticle>
      <ArticleHeader {...props} locale={locale} metadata={structuredClone(metadata)} dictionaries={dictionaries} toc={pageContent}/>
      {children}
      <PageNavs locale={locale} metadata={structuredClone(metadata)} pageCategories={pageCategories} dictionaries={dictionaries} />
    </DocArticle>
  )

  return (
    <DocMain className={props.className} footerProps={footerProps}>
      {article}
      {pageContent && (
        <>
          <PageContentProvider items={pageContent}>
            <PageContent metadata={structuredClone(metadata)} />
            <PageContentBlockMap />
          </PageContentProvider>
          <PageContentBootstrap items={pageContent} />
        </>
      )}
    </DocMain>
  )
}
