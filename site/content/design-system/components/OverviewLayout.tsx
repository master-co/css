import '~/site/styles/design-system.css'
import DocMain from '~/site/docs-shell/components/DocMain'
import ArticleHeader from '~/site/docs-shell/components/ArticleHeader'
import { footerProps } from '~/site/navigation'

export default function OverviewLayout({ children, params, metadata, dictionaries }: any) {
  return <DocMain footerProps={footerProps}>
    <article className="ui-handbook ui-prose">
      <ArticleHeader locale={params.locale} metadata={metadata} dictionaries={dictionaries} toc={null} />
      {children}
    </article>
  </DocMain>
}
