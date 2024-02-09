import Article from 'websites/components/Article'
import ArticleHeader from 'websites/components/ArticleHeader'
import PageNavs from 'websites/components/PageNavs'
import DocMain from '../components/DocMain'
import DocFooter from '../components/DocFooter'
import pages from '../app/[locale]/(root)/pages'
import PageContent from 'websites/components/PageContent'
import clsx from 'clsx'
import parentModule from 'parent-module'

const pageSourcePath = 'website/app/[locale]/(root)/' + parentModule()?.match(/\(root\)\/(.*)\/page\.js/)?.[1] + '/content.mdx'
const owner = 'master-co'
const repo = 'css'
const branch = 'rc'
const url = `https://api.github.com/repos/${owner}/${repo}/commits?sha=${branch}&per_page=1&path=${encodeURIComponent(pageSourcePath)}`

async function fetchLastCommit() {
    const response = await fetch(url, {
        headers: {
            'Accept': 'application/vnd.github.v3+json'
        }
    })
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
    }
    const commits = await response.json()
    if (commits.length > 0) {
        return commits[0]
    } else {
        console.log('No commits found for this file.')
    }
}

export default async function Layout({ children, params, toc, prose, $hideLeftSide, ...props }: any) {
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
            {toc && <PageContent locale={params.locale} metadata={props.metadata} lastCommit={await fetchLastCommit()}>{toc}</PageContent>}
        </>
    )
}