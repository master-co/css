import Article from 'websites-shared/components/Article';
import ArticleHeader from 'websites-shared/components/ArticleHeader';
import CanIUseButton from 'websites-shared/components/CanIUseButton'
import MdnButton from 'websites-shared/components/MdnButton'
import { l } from 'to-line'
import DocMain from './DocMain';
import DocFooter from './DocFooter';
import PageNavs from 'websites-shared/components/PageNavs';
import pages from '../app/[locale]/(root)/pages'
import dynamic from 'next/dynamic';

const PageContent = dynamic(() => import('websites-shared/components/PageContent'))

export default async function Layout(props: any) {
    const { children, params, toc } = props
    let { mdn = true, canIUse = true, ...metadata } = props.metadata
    return <>
        <DocMain>
            <Article>
                {/* @ts-expect-error server component */}
                <ArticleHeader locale={params.locale} metadata={metadata} titleBig={true} />
                {children}
            </Article>
            {/* @ts-expect-error server component */}
            <PageNavs locale={params.locale} metadata={props.metadata} pages={pages} />
            {/* @ts-expect-error server component */}
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