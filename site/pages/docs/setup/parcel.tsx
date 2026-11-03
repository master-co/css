import Code from '~/components/Code'
import HelloWorldSection from '~/components/Css/HelloWorld'
import InstallStyles from '~/components/Css/InstallStyles'
import CssDoc from '~/layouts/CssDoc'
import ParcelSvg from '~/public/images/build-tools/parcel.svg'
import { iconGuide } from '~/styles/icon-guide'
import CodeTabs from '~/components/Code/CodeTabs'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

export default function Parcel() {
    return (
        <>
            <ParcelSvg className={iconGuide + ' scale(1.4)'} />
            <p>A quick guide to start using Master CSS in your Parcel project.</p>
            <h2 id="quick-start">Quick start</h2>
            <h3 id="create-a-project">1. Create a Parcel project</h3>
            <p>
                If you don&#39;t have a Parcel project, create one first. It&#39;s recommended to refer <a href="https://parceljs.org/getting-started/webapp/" target="blank">Getting Started</a> :
            </p>
            <Code lang="bash">
                {`
                    mkdir __project__
                    cd __project__
                `}
            </Code>
            <CodeTabs>{[
                {
                    name: 'npm', lang: 'bash',
                    code: 'npm init -y \n npm install --save-dev parcel \n'
                },
                {
                    name: 'yarn', lang: 'bash',
                    code: 'yarn init -y \n yarn add --dev parcel'
                }
            ]}</CodeTabs>
            <h3 id="installation">2. Installation</h3>
            <InstallStyles />
            <h3 id="import">3. Import</h3>
            <p>
                Create a <code>index.html</code> and <code>index.js</code>.
            </p>
            <Code lang="js" name="index.js">
                {`
                    import '@master/css';
                `}
            </Code>
            <Code lang="html" name="index.html" addLines={[5]} lineNumbers>
                {`
                   <!doctype html>
                   <html lang="en">
                   
                   <head>
                       <meta charset="utf-8" />
                       <script type="module" src="index.js"></script>
                       <title>My First Parcel App</title>
                   </head>
                   
                   <body>
                       <h1 class="font:40 font:heavy italic m:50 text:center">
                           Hello World
                       </h1>
                   </body>
                   
                   </html>
                `}
            </Code>
            <h3 id="launch-server">4. Launch server</h3>
            <CodeTabs>{[
                {
                    name: 'npx', lang: 'bash',
                    code: 'npx parcel index.html'
                },
                {
                    name: 'yarn', lang: 'bash',
                    code: 'yarn parcel index.html'
                }
            ]}</CodeTabs>
            <h3 id="hello-world">Hello world</h3>
            <HelloWorldSection url="localhost:1234"></HelloWorldSection>
            {/* <h2 id="hybrid-rendering">Hybrid rendering</h2>
            <p>
                We devised a <b>hybrid architecture</b> that allows you to <b>pre-generate CSS from HTML</b> on the server
                side, and then continue to use <b>JIT</b> on the client side by reverse parsing.
            </p>
            <p><i>More to come ...</i> 🚧</p> */}
        </>
    )
}

const localeNamespace = 'docs.css.parcel'

Parcel.page = {
    layout: CssDoc,
    title: 'Set up Master CSS in Parcel',
    description: 'A quick guide to start using Master CSS in your Parcel project.',
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