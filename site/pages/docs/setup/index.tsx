import Code from '~/components/Code'
import CssDoc from '~/layouts/CssDoc'
import { frameworks } from '~/data/frameworks';
import { buildTools } from '~/data/build-tools';
import { onlineEditors } from '~/data/online-editors';
import InstallStyles from '~/components/Css/InstallStyles';
import Link from '~/components/Link';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import ALink from '~/components/ALink';


export default function Setup({ t }: any) {
    return (
        <>
            <p>For a fixed cost of <b>~14KB</b>, all features are included without complex build environments like webpack, gulp and postcss.</p>
            <h2 id="online-editors">{t('Online editors')}</h2>
            <div className="grid-cols:2 grid-cols:3@2xs grid-cols:4@xs grid-cols:6@sm gap:10">
                {
                    onlineEditors.map((buildTool) => (
                        <a key={buildTool.name} className="filledBtn square p:20|10 r:5" href={buildTool.url} target="blank">
                            <buildTool.Logo width="44" height="44" className={buildTool.class} />
                            <div className="f:12 mt:10">{buildTool.name}</div>
                        </a>
                    ))
                }
            </div>
            <h2 id="framework-guides">{t('Framework guides')}</h2>
            <p>We&#39;re <b>framework-agnostic</b>, but we provide friendly guides to help you get started quickly:</p>
            <div className="grid-cols:2 grid-cols:3@2xs grid-cols:4@xs grid-cols:6@sm gap:10">
                {
                    frameworks.map((framework) => (
                        <ALink className="filledBtn square p:20|10 r:5"
                            href={`/docs/setup/${framework.name.replace('.', '').toLowerCase()}`}
                            key={framework.name}>
                            <framework.Logo width="44" height="44" className={framework.class} />
                            <div className="f:12 mt:10">{framework.name}</div>
                        </ALink>
                    ))
                }
            </div>
            <h2 id="build-tool-guides">{t('Build tool guides')}</h2>
            <div className="grid-cols:2 grid-cols:3@2xs grid-cols:4@xs grid-cols:6@sm gap:10">
                {
                    buildTools.map((buildTool) => (
                        <ALink href={`/docs/setup/${buildTool.name.replace('.', '').toLowerCase()}`}
                            key={buildTool.name} className="filledBtn square p:20|10 r:5">
                            <buildTool.Logo width="44" height="44" className={buildTool.class} />
                            <div className="f:12 mt:10">{buildTool.name}</div>
                        </ALink>
                    ))
                }
            </div>
            <h2 id="using-cdns">{t('Quickly launch via CDNs')}</h2>
            <Code lang="html" addLines={[6]} name="index.html" lineNumbers>
                { /* html */`
                    <!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="utf-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1">
                        <script src="https://cdn.master.co/css"></script>
                    </head>
                    <body>
                        <h1 class="**font:40** **font:heavy** **italic** **m:50** **text:center**">Hello World</h1>
                    </body>
                    </html>
                `}
            </Code>
            <p className="t:12">* The example above points to the latest version of the scales.</p>
            <p className="t:12 mt:-1em">* Pinning your scales to a specific version in production, like <code>https://cdn.master.co/css@1.0.0</code></p>
            <h2 id="download">{t('Download')}</h2>
            <h3 id="install-to-your-project">{t('1. Install to your project')}</h3>
            <InstallStyles />
            <h3 id="import-into-entry-files">{t('2. Import into your entry file')}</h3>
            <p>Add <code>@master/css</code> from <code>node_modules</code> to your JS entry file:</p>
            <Code lang="javascript" name="main.js">
                {`import '@master/css';`}
            </Code>
            <h2 id="browser-support">{t('Browser support')}</h2>
            <p>
                We uses <b>Mutation Observer</b> ( even IE 11 is supported ) to observe the DOM tree and traverse each class through
                a unique rule
                engine to
                generate the corresponding CSS and inject it into the browser instantly.
            </p>
            <blockquote>
                <p>
                    Our core code supports most browsers, you need to pay attention to the support of CSS properties currently used.
                </p>
            </blockquote>
            <p>
                The author has added appropriate vendor prefixes to some styles, you just need to make sure that the CSS
                properties you are currently using support most modern browsers ─── <a href="https://caniuse.com/" target="blank">caniuse.com</a>
            </p>
        </>
    )
}

const localeNamespace = 'docs.css.setup'

Setup.page = {
    layout: CssDoc,
    title: 'Getting started with Master CSS',
    suffix: '',
    description: 'For a fixed cost of ~14KB, all features are included without complex build environments like webpack, gulp and postcss.',
    editors: ['Aron', 'Lola'],
    localeNamespace
};

export async function getStaticProps({ locale }: any) {
    return {
        props: {
            ...(await serverSideTranslations(locale, ['common', 'css', localeNamespace])),
        },
    };
}