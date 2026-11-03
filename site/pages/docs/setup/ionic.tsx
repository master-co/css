import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import Code from '~/components/Code'
import HelloWorldSection from '~/components/Css/HelloWorld'
import InstallStyles from '~/components/Css/InstallStyles'
import ShorthandList from '~/components/Css/ShorthandList'
import CssDoc from '~/layouts/CssDoc'
import IonicSvg from '~/public/images/frameworks/ionic.svg'
import { iconGuide } from '~/styles/icon-guide'

export default function Ionic() {
    return (
        <>
            <IonicSvg className={iconGuide} />
            <p>A quick guide to start using Master CSS in your Ionic project.</p>
            <h2 id="quick-start">Quick start</h2>
            <h3 id="create-a-project">1. Create a Ionic project</h3>
            <p>
                If you don&#39;t have a Ionic project, create one first. It&#39;s recommended to refer <a href="https://ionicframework.com/docs/developing/starting" target="blank">Create Ionic Project</a>:
            </p>
            <Code lang="bash">
                {`
                    ionic start __project__ blank
                    cd __project__
                `}
            </Code>
            <p className="t:12">
                The tutorial uses <a href="https://ionicframework.com/docs/v4" target="blank">Ionic Framework v4</a>, select the framework <code>Angular</code>, <code>React</code> or <code>Vue.js</code> which you want.
            </p>
            <h3 id="installation">2. Installation</h3>
            <InstallStyles />
            <h3 id="choose-your-framework">3. Choose your framework</h3>
            <p>
                Please refer to your framework&#39;s tutorial and set it up:
            </p>
            <ShorthandList items={[
                { name: 'Angular', url: 'angular##configure-angularjson' },
                { name: 'React', url: 'react#import' },
                { name: 'Vue.js', url: 'vuejs#import' },
            ]}>
            </ShorthandList>
            <h3 id="launch-server">4. Launch server</h3>
            <Code lang="bash">
                {`ionic serve`}
            </Code>
            <h3 id="hello-world">Hello world</h3>
            <HelloWorldSection url="localhost:8100 / device"></HelloWorldSection>
            {/* <h2 id="hybrid-rendering">Hybrid rendering</h2>
            <p>
                We devised a <b>hybrid architecture</b> that allows you to <b>pre-generate CSS from HTML</b> on the server
                side, and then continue to use <b>JIT</b> on the client side by reverse parsing.
            </p>
            <p><i>More to come ...</i> 🚧</p> */}
        </>
    )
}

const localeNamespace = 'docs.css.ionic'

Ionic.page = {
    layout: CssDoc,
    title: 'Set up Master CSS in Ionic',
    description: 'A quick guide to start using Master CSS in your Ionic project.',
    suffix: '',
    h1ClassName: 'mr:110',
    subtitle: 'Getting Started',
    cover: 'ionic.jpg',
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