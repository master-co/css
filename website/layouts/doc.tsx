import Article from 'websites/components/Article'
import ArticleHeader from 'websites/components/ArticleHeader'
import PageNavs from 'websites/components/PageNavs'
import DocMain from '../components/DocMain'
import DocFooter from '../components/DocFooter'
import pages from '../app/[locale]/(root)/pages'
import PageContent from 'websites/components/PageContent'
import clsx from 'clsx'

export default function Layout({ children, params, toc, prose, $hideLeftSide, ...props }: any) {
    return <>
        <DocMain $hideRightSide={!toc} $hideLeftSide={$hideLeftSide}>
            <Article className={clsx({ 'max-w:screen-sm_:where(p)': !toc })} prose={prose}>
                <ArticleHeader locale={params.locale} metadata={props.metadata} {...props} />
                {children}
            </Article>
            <PageNavs locale={params.locale} metadata={props.metadata} pages={pages} />
            <DocFooter locale={params.locale} title={props.metadata.title} editors={props.metadata.authors} />
        </DocMain>
        {toc && <PageContent locale={params.locale}>{toc}</PageContent>}
    </>
}