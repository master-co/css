import Article from 'websites/components/Article'
import ArticleHeader from 'websites/components/ArticleHeader'
import DocMain from '../components/DocMain'
import DocFooter from '../components/DocFooter'
import PageNavs from 'websites/components/PageNavs'
import pages from '../app/[locale]/(root)/pages'
import PageContent from 'websites/components/PageContent'
import fetchLastCommit from 'websites/utils/fetch-last-commit'
import project from '~/project'

export default async function Layout({ children, pageDirname, params, toc, $hideLeftSide, ...props }: any) {
    return <>
        <DocMain $hideRightSide={!toc} $hideLeftSide={$hideLeftSide}>
            <Article>
                <ArticleHeader {...props} metadata={props.metadata} />
                {children}
            </Article>
            <PageNavs metadata={props.metadata} pages={pages} />
            <DocFooter locale={params.locale} />
        </DocMain>
        {toc && <PageContent locale={params.locale} metadata={props.metadata} pageDirname={pageDirname} lastCommit={await fetchLastCommit(pageDirname, project)}>{toc}</PageContent>}
    </>
}