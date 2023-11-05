import Article from 'shared/components/Article';
import ArticleHeader from 'shared/components/ArticleHeader';
import PageNavs from 'shared/components/PageNavs'
import DocMain from './DocMain';
import DocFooter from './DocFooter';
import { l } from 'to-line';
import pages from '../app/[locale]/(root)/pages'
import dynamic from 'next/dynamic';

const PageContent = dynamic(() => import('shared/components/PageContent'))

export default async function Layout(props: any) {
    const { children, params, toc, backOnClickCategory, icon, titleBig = true, $hideLeftSide } = props
    return <>
        <DocMain $hideRightSide={!toc} $hideLeftSide={$hideLeftSide}>
            <Article className={l({ 'max-w:sm_:where(p)': !toc })}>
                {/* @ts-expect-error server component */}
                <ArticleHeader locale={params.locale} metadata={props.metadata} backOnClickCategory={backOnClickCategory} icon={icon} titleBig={titleBig} />
                {children}
            </Article>
            {/* @ts-expect-error server component */}
            <PageNavs locale={params.locale} metadata={props.metadata} pages={pages} />
            {/* @ts-expect-error server component */}
            <DocFooter locale={params.locale} title={props.metadata.title} editors={props.metadata.authors} />
        </DocMain>
        {toc && <PageContent locale={params.locale}>{toc}</PageContent>}
    </>
}