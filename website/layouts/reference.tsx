'use client'

import Article from 'websites/components/Article'
import ArticleHeader from 'websites/components/ArticleHeader'
import canIUseImg from '~/public/images/caniuse.favicon.png'
import mdnImg from '~/public/images/mdnwebdocs.png'
import DocMain from '../components/DocMain'
import DocFooter from '../components/DocFooter'
import PageNavs from 'websites/components/PageNavs'
import pages from '../app/[locale]/(root)/pages'
import PageContent from 'websites/components/PageContent'
import Link from 'websites/components/Link'
import Image from 'next/image'

export default function Layout(props: any) {
    const { children, params, toc } = props
    const { mdnLink, canIUseLink, ...metadata } = props.metadata
    return <>
        <DocMain>
            <Article>
                <ArticleHeader metadata={metadata} titleBig />
                {children}
            </Article>
            <PageNavs metadata={props.metadata} pages={pages} />
            <DocFooter locale={params.locale} title={metadata.title} />
        </DocMain>
        {toc && <PageContent locale={params.locale}
            start={(canIUseLink || mdnLink) &&
                <>
                    {
                        canIUseLink &&
                        <Link href={canIUseLink} rel="noreferrer noopener" target="_blank" className="inline-flex content:none::after overflow:hidden r:2">
                            <Image src={canIUseImg} width={24} height={24} alt="Can I use ?" />
                        </Link>
                    }
                    {
                        mdnLink &&
                        <Link href={mdnLink} rel="noreferrer noopener" target="_blank" className="inline-flex content:none::after overflow:hidden r:2">
                            <Image src={mdnImg} width={24} height={24} alt="Can I use ?" />
                        </Link>
                    }
                </>}>
            {toc}
        </PageContent>}
    </>
}