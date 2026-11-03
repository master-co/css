import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import Code from '~/components/Code'
import HelloWorldSection from '~/components/Css/HelloWorld'
import InstallStyles from '~/components/Css/InstallStyles'
import CssDoc from '~/layouts/CssDoc'
import RemixSvg from '~/public/images/frameworks/remix.svg'
import { iconGuide } from '~/styles/icon-guide'

export default function Remix() {
    return (
        <>
            <RemixSvg className={iconGuide + ' scale(1.2) invert(1)@dark'} />
            <p>A quick guide to start using Master CSS in your Remix project.</p>
            <h2 id="quick-start">Quick start</h2>
            <h3 id="create-a-project">1. Create a Remix project</h3>
            <p>
                If you don&#39;t have a Remix project, create one first. It&#39;s recommended to refer <a href="https://remix.run/docs/en/v1/tutorials/blog#creating-the-project" target="blank">Create Remix Project</a>:
            </p>
            <Code lang="bash">
                {`
                    npx create-remix@latest __project__
                    cd __project__
                `}
            </Code>
            <p className="t:12">
                * NPM version &lt; 7, then <code> npm init Remix@latest my-vue-app --template vue</code>
            </p>

            <h3 id="installation">2. Installation</h3>
            <InstallStyles />
            <h3 id="import">3. Import</h3>
            <Code lang="ts" name="entry.client.tsx" addLines={[4]} lineNumbers>
                {`
                   import { hydrate } from "react-dom";
                   import { RemixBrowser } from "remix";
                     
                   import '@master/css';
                     
                   hydrate( <RemixBrowser />, document)
                `}
            </Code>
            <h3 id="launch-server">4. Launch server</h3>
            <Code lang="bash">
                {`npm run dev`}
            </Code>
            <h3 id="hello-world">Hello world</h3>
            <HelloWorldSection url="localhost:65154"></HelloWorldSection>
            <Code lang="ts" name="root.tsx" addLines={[1, 8, 20, 21, 22]} lineNumbers>
                {`
                    import styles from '@master/normal.css'

                    import { Links, Scripts } from "remix";
                    import type { LinksFunction } from "remix";

                    export const links: LinksFunction = () => {
                        return [
                            { rel: "stylesheet", href: styles }
                        ];
                    };

                    export default function App() {
                    return (
                        <html lang="en">
                        <head>
                            <Links />
                        </head>
                        <body>
                            <Scripts />
                            <h1 className="font:40 font:heavy italic m:50 text:center">
                                Hello World
                            </h1>
                        </body>
                        </html>
                    )
                    }
                `}
            </Code>
            {/* <h2 id="hybrid-rendering">Hybrid rendering</h2>
            <p>
                We devised a <b>hybrid architecture</b> that allows you to <b>pre-generate CSS from HTML</b> on the server
                side, and then continue to use <b>JIT</b> on the client side by reverse parsing.
            </p>
            <p><i>More to come ...</i> 🚧</p> */}
        </>
    )
}

const localeNamespace = 'docs.css.remix'

Remix.page = {
    layout: CssDoc,
    title: 'Set up Master CSS in Remix',
    description: 'A quick guide to start using Master CSS in your Remix project.',
    suffix: '',
    h1ClassName: 'mr:110',
    subtitle: 'Getting Started',
    editors: ['Lola'],
    localeNamespace
};

export async function getStaticProps({ locale }: any) {
    return {
        props: {
            ...(await serverSideTranslations(locale, ['common', 'css', localeNamespace])),
        },
    };
};