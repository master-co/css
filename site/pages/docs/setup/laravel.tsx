import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import Code from '~/components/Code'
import HelloWorldSection from '~/components/Css/HelloWorld'
import InstallStyles from '~/components/Css/InstallStyles'
import CssDoc from '~/layouts/CssDoc'
import LaravelSvg from '~/public/images/frameworks/laravel.svg'
import { iconGuide } from '~/styles/icon-guide'

export default function Laravel() {
    return (
        <CssDoc title="Setup in Laravel" subtitle="Framework Guide" authors={['Miles']}>
            <LaravelSvg className={iconGuide + ' scale(.8)'} />
            <p>A quick guide to start using Master CSS in your Laravel project.</p>
            <h2 id="quick-start">Quick start</h2>
            <h3 id="create-a-project">1. Create a Laravel project</h3>
            <p>
                If you don&#39;t have a Laravel project, create one first. It&#39;s recommended to refer <a href="https://laravel.com/docs/8.x#the-laravel-installer" target="blank">Laravel Installer</a> :
            </p>
            <Code lang="bash">
                {`
                    laravel new __project__
                    cd __project__
                `}
            </Code>
            <h3 id="installation">2. Installation</h3>
            <InstallStyles />
            <h3 id="import">3. Import</h3>
            <Code lang="js" name="resources/js/app.js">
                {`
                   require('@master/css')
                `}
            </Code>
            <h3 id="launch-server">4. Launch server</h3>
            <Code lang="bash">
                {`npm run watch`}
            </Code>
            <h3 id="hello-world">Hello world</h3>
            <HelloWorldSection url="localhost:4200"></HelloWorldSection>
            <Code lang="html" name="app.blade.php">
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
        </CssDoc>
    )
}

const localeNamespace = 'docs.css.laravel'

Laravel.page = {
    layout: CssDoc,
    title: 'Set up Master CSS in Laravel',
    description: 'A quick guide to start using Master CSS in your Laravel project.',
    suffix: '',
    h1ClassName: 'mr:110',
    subtitle: 'Getting Started',
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
