import '~/site/styles/design-system.css'
import '~/site/styles/docs-shell/prose.css'
import DocMain from '~/site/docs-shell/components/DocMain'
import ArticleHeader from '~/site/docs-shell/components/ArticleHeader'
import { footerProps } from '~/site/navigation'

export default function OverviewLayout({ children, params, metadata, dictionaries }: any) {
  return <DocMain footerProps={footerProps}>
    <article className="ds-overview prose">
      <header className="ds-overview-header">
        <ArticleHeader locale={params.locale} metadata={metadata} dictionaries={dictionaries} toc={null} />
      </header>
      {children}
    </article>
  </DocMain>
}
