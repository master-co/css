// @ts-ignore
import { useTranslation } from 'next-i18next';
import MasterSvg from '~/svgs/Master';
import MasterTextSvg from '~/svgs/MasterText';
import cssContents from '~/contents/cssContents';
import { useState } from 'react';
import Script from 'next/script';
import Link from '~/components/Link';

const FooterSection = () => {
    const { t } = useTranslation('home.css')
    return (
        <section className="py:50 py:120@md">
            <Script strategy='lazyOnload' src="https://buttons.github.io/buttons.js" />
            <div className="homeContainer">
                <ul className="
                        grid-cols:1 grid-cols:2@xs grid-cols:4@md gap:40 
                        {font:gray-60;block}_a color:inherit_a:hover 
                        {font:16;font:medium}_h2
                        {flex;flex:col;gap:10}_ul
                    ">
                    <li className="flex flex:col gap:10">
                        <div className="flex align-items:center gap:10 mb:10">
                            <MasterSvg className="w:48"></MasterSvg>
                            <MasterTextSvg className="w:94 f:gray-88@dark"></MasterTextSvg>
                        </div>
                        <a className="github-button" href="https://github.com/master-co/css" data-color-scheme="no-preference: light; light: light; dark: dark;" data-icon="octicon-star" data-size="large" data-show-count="true" aria-label="Star ntkme/github-buttons on GitHub">Star</a>
                        <a href="https://www.producthunt.com/posts/master-css?utm_source=badge-featured&utm_medium=badge&utm_souce=badge-master&#0045;css" target="_blank" rel="noreferrer">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=356158&theme=dark" alt="Master&#0032;CSS - A&#0032;Virtual&#0032;CSS&#0032;language&#0032;with&#0032;enhanced&#0032;syntax&#0046; | Product Hunt" width={250} height={54} />
                        </a>
                    </li>
                    <li>
                        <List title="Getting Started" />
                        <List title="Concepts and Principles" className="mt:40" />
                    </li>
                    <li>
                        <List title="References" />
                    </li>
                    <li>
                        <ul>
                            <li>
                                <h2>{t('Community')}</h2>
                            </li>
                            <li><a href="https://github.com/master-co/css" target="blank">Github</a></li>
                            <li><a href="https://discord.gg/sZNKpAAAw6" target="blank">Discord</a></li>
                            <li><a href="https://twitter.com/mastercorg" target="blank">Twitter</a></li>
                            <li><a href="https://github.com/master-co/css/discussions" target="blank">Discussions</a></li>
                        </ul>
                    </li>
                </ul>
            </div>
        </section>
    )
}

function List({ title, className }: any) {
    const { t } = useTranslation('home.css')
    const [contents] = useState((cssContents as any)[title])
    return (
        <ul className={className}>
            <li>
                <h2>{t(title)}</h2>
            </li>
            {contents.map((childTitle: any) =>
                <li key={childTitle}>
                    <Link href={"/docs/" + (childTitle).toLowerCase().replace(/ /g, '-')}>{t(childTitle)}</Link>
                </li>
            )}
        </ul>
    )
}

export default FooterSection;