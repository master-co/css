import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import Code from '~/components/Code'
import HelloWorldSection from '~/components/Css/HelloWorld'
import InstallStyles from '~/components/Css/InstallStyles'
import CssDoc from '~/layouts/CssDoc'
import AstroSvg from '~/public/images/frameworks/astro.svg'
import { iconGuide } from '~/styles/icon-guide'

export default function Astro() {
    return (
        <>
            <AstroSvg className={iconGuide + ' scale(1.3)'} />
            <p>A quick guide to start using Master CSS in your Astro project.</p>
            <h2 id="quick-start">Quick start</h2>
            <h3 id="create-an-astro-project">1. Create an Astro project</h3>
            <p>
                If you don&#39;t have an Astro project, create one first. It&#39;s recommended to refer <a href="https://docs.astro.build/en/getting-started/" target="blank">Getting Started</a> :
            </p>
            <Code lang="bash">
                {`
                    npm create astro@latest
                    cd __project__
                `}
            </Code>
            <h3 id="installation">2. Installation</h3>
            <InstallStyles />
            <h3 id="import">3. Import</h3>
            <Code lang="html" name="layouts/Layout.astro" addLines={[4,5,6]} lineNumbers>
                {`
                    <html>
                        <head>
                            ...
                            <script>
                                import "@master/css";
                            </script>
                        </head>
                        ...
                    <html>
                `}
            </Code>
            <h3 id="launch-server">4. Launch server</h3>
            <Code lang="bash">
                {`npm run dev`}
            </Code>
            <h3 id="hello-world">Hello world</h3>
            <HelloWorldSection url="localhost:3000"></HelloWorldSection>
            <Code lang="tsx" name="pages/index.astro" addLines={[4, 5, 6]} lineNumbers>
                {`
                    import Layout from '../layouts/Layout.astro';
                    <Layout title="Welcome to Astro.">
                        <main>
                            <h1 class="font:40 font:heavy italic m:50 text:center">
                                Hello World
                            </h1>
                        </main>
                    </Layout>
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

const localeNamespace = 'docs.css.astro'

Astro.page = {
    layout: CssDoc,
    title: 'Set up Master CSS in Astro',
    description: 'A quick guide to start using Master CSS in your Astro project.',
    suffix: '',
    h1ClassName: 'mr:110',
    subtitle: 'Getting Started',
    cover: 'astro.jpg',
    editors: ['Joy'],
    localeNamespace
};

export async function getStaticProps({ locale }: any) {
    return {
        props: {
            ...(await serverSideTranslations(locale, ['common', 'css', localeNamespace])),
        },
    };
};
