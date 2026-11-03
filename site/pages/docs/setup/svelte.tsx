import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import Code from '~/components/Code'
import HelloWorldSection from '~/components/Css/HelloWorld'
import InstallStyles from '~/components/Css/InstallStyles'
import CssDoc from '~/layouts/CssDoc'
import SvelteSvg from '~/public/images/frameworks/svelte.svg'
import { iconGuide } from '~/styles/icon-guide'

export default function Svelte() {
    return (
        <>
            <SvelteSvg className={iconGuide + ' scale(.85)'} />
            <p>A quick guide to start using Master CSS in your Svelte project.</p>
            <h2 id="quick-start">Quick start</h2>
            <h3 id="create-a-project">1. Create a Svelte project</h3>
            <p>
                If you don&#39;t have a Svelte project, create one first. It&#39;s recommended to refer <a href="https://svelte.dev/blog/the-easiest-way-to-get-started" target="blank">Create Svelte Project</a>:
            </p>
            <Code lang="bash">
                {`
                    npx degit sveltejs/template __project__
                    cd __project__
                `}
            </Code>
            <h3 id="installation">2. Installation</h3>
            <InstallStyles />
            <h3 id="import">3. Import</h3>
            <Code lang="js" name="main.js">
                {`
                  import '@master/css';
                `}
            </Code>
            <h3 id="launch-server">4. Launch server</h3>
            <Code lang="bash">
                {`npm run dev`}
            </Code>
            <h3 id="hello-world">Hello world</h3>
            <HelloWorldSection url="localhost:8080"></HelloWorldSection>
            <Code lang="html" name="App.svelte" lineNumbers>
                {`
                    <h1 class="font:40 font:blue font:heavy italic m:50 text:center">
                        Hello World
                    </h1>
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

const localeNamespace = 'docs.css.svelte'

Svelte.page = {
    layout: CssDoc,
    title: 'Set up Master CSS in Svelte',
    description: 'A quick guide to start using Master CSS in your Svelte project.',
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