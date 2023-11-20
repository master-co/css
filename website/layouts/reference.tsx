import Article from 'websites/components/Article'
import ArticleHeader from 'websites/components/ArticleHeader'
import CanIUseButton from 'websites/components/CanIUseButton'
import MdnButton from 'websites/components/MdnButton'
import { l } from 'to-line'
import DocMain from '../components/DocMain'
import DocFooter from '../components/DocFooter'
import PageNavs from 'websites/components/PageNavs'
import pages from '../app/[locale]/(root)/pages'
import dynamic from 'next/dynamic'

const PageContent = dynamic(() => import('websites/components/PageContent'))

export default async function Layout(props: any) {
    const { children, params, toc } = props
    const { mdn = true, canIUse = true, ...metadata } = props.metadata
    return <>
        <DocMain>
            <Article>
                <ArticleHeader locale={params.locale} metadata={metadata} titleBig={true} />
                {children}
            </Article>
            <PageNavs locale={params.locale} metadata={props.metadata} pages={pages} />
            <DocFooter locale={params.locale} title={metadata.title} />
        </DocMain>
        {toc && <PageContent locale={params.locale}
            start={
                <>
                    {canIUse && <CanIUseButton src={canIUse} title={metadata.title} className="r:2" width="24" height="24" />}
                    {mdn && <MdnButton src={mdn} title={metadata.title} className="r:2" width="24" height="24" />}
                </>
            }>
            {toc}
        </PageContent>}
    </>
}