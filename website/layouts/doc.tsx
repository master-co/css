import Article from 'websites/components/Article'
import ArticleHeader from 'websites/components/ArticleHeader'
import PageNavs from 'websites/components/PageNavs'
import DocMain from '../components/DocMain'
import DocFooter from '../components/DocFooter'
import pages from '../app/[locale]/(root)/pages'
import PageContent from 'websites/components/PageContent'
import clsx from 'clsx'
import fetchLastCommit from 'websites/utils/fetch-last-commit'
import project from '~/project'

export default async function Layout({ children, pageDirname, params, toc, prose, $hideLeftSide, ...props }: any) {
    return (
        <>
            <DocMain $hideRightSide={!toc} $hideLeftSide={$hideLeftSide}>
                <Article className={clsx({ 'max-w:screen-sm_:where(p)': !toc })} prose>
                    <ArticleHeader {...props} metadata={props.metadata} />
                    {children}
                </Article>
                <PageNavs metadata={props.metadata} pages={pages} />
                <DocFooter locale={params.locale} />
            </DocMain>
            {toc && <PageContent locale={params.locale} metadata={props.metadata} lastCommit={await fetchLastCommit(pageDirname, project)}>{toc}</PageContent>}
        </>
    )
}