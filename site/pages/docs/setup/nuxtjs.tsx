import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import Code from '~/components/Code'
import HelloWorldSection from '~/components/Css/HelloWorld'
import InstallStyles from '~/components/Css/InstallStyles'
import CssDoc from '~/layouts/CssDoc'
import NuxtjsSvg from '~/public/images/frameworks/nuxtjs.svg'
import { iconGuide } from '~/styles/icon-guide'

export default function Nuxtjs() {
    return (
        <>
            <NuxtjsSvg className={iconGuide + ' scale(1.4)'} />
            <p>A quick guide to start using Master CSS in your Nuxt.js project.</p>
            <h2 id="quick-start">Quick start</h2>
            <h3 id="create-a-project">1. Create a Nuxt.js project</h3>
            <p>
                If you don&#39;t have a Nuxt.js project, create one first. It&#39;s recommended to refer <a href="https://github.com/nuxt/create-nuxt-app" target="blank">Create Nuxt App</a> :
            </p>
            <Code lang="bash">
                {`
                    npx create-nuxt-app __project__
                    cd __project__
                `}
            </Code>
            <h3 id="installation">2. Installation</h3>
            <InstallStyles />
            <h3 id="import">3. Import</h3>
            <Code lang="html" name="index.vue">
                {`
                    <script lang="ts">
                        import '@master/css';
                    </script>
                `}
            </Code>
            <h3 id="launch-server">4. Launch server</h3>
            <Code lang="bash">
                {`npm run dev`}
            </Code>
            <h3 id="hello-world">Hello world</h3>
            <HelloWorldSection url="localhost:4200"></HelloWorldSection>
            <Code lang="html" name="Tutorial.vue">
                {`
                    <h1 class="font:40 font:heavy italic m:50 text:center">
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

const localeNamespace = 'docs.css.nuxtjs'

Nuxtjs.page = {
    layout: CssDoc,
    title: 'Set up Master CSS in Nuxt.js',
    description: 'A quick guide to start using Master CSS in your Nuxt.js project.',
    suffix: '',
    h1ClassName: 'mr:110',
    subtitle: 'Getting Started',
    editors: ['Benseage'],
    localeNamespace
};

export async function getStaticProps({ locale }: any) {
    return {
        props: {
            ...(await serverSideTranslations(locale, ['common', 'css', localeNamespace])),
        },
    };
};