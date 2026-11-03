import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import Code from '~/components/Code'
import HelloWorldSection from '~/components/Css/HelloWorld'
import InstallStyles from '~/components/Css/InstallStyles'
import CssDoc from '~/layouts/CssDoc'
import VuejsSvg from '~/public/images/frameworks/vue.js.svg'
import { iconGuide } from '~/styles/icon-guide'

export default function Vuejs() {
    return (
        <>
            <VuejsSvg className={iconGuide + ' scale(.85)'} />
            <p>A quick guide to start using Master CSS in your Vue.js project.</p>
            <h2 id="quick-start">Quick start</h2>
            <h3 id="create-a-project">1. Create a Vite project</h3>
            <p>
                If you don&#39;t have a Vite project, create one first. It&#39;s recommended to refer <a href="https://vitejs.dev/guide/#scaffolding-your-first-vite-project" target="blank">Getting Started</a> :
            </p>
            <Code lang="bash">
                {`
                    npm init vite@latest __project__ --template vue
                    cd __project__
                `}
            </Code>
            <p className="t:12">
                * NPM version &lt; 7, then <code> npm init vite@latest my-vue-app --template vue</code>
            </p>

            <h3 id="installation">2. Installation</h3>
            <InstallStyles />
            <h3 id="import">3. Import</h3>
            <Code lang="html" name="App.vue" addLines={[2]} lineNumbers>
                {`
                    <script setup>
                        import '@master/css';
                        …
                    </script>
                `}
            </Code>
            <h3 id="launch-server">4. Launch server</h3>
            <Code lang="bash">
                {`npm run dev`}
            </Code>
            <h3 id="hello-world">Hello world</h3>
            <HelloWorldSection url="localhost:4200"></HelloWorldSection>
            <Code lang="html" name="App.vue">
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

const localeNamespace = 'docs.css.vuejs'

Vuejs.page = {
    layout: CssDoc,
    title: 'Set up Master CSS in Vue.js',
    description: 'A quick guide to start using Master CSS in your Vue.js project.',
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