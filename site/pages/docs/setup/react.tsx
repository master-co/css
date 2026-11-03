import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import Code from '~/components/Code'
import HelloWorldSection from '~/components/Css/HelloWorld'
import InstallStyles from '~/components/Css/InstallStyles'
import CssDoc from '~/layouts/CssDoc'
import ReactSvg from '~/public/images/frameworks/react.svg'
import { iconGuide } from '~/styles/icon-guide'

export default function React() {
    return (
        <>
            <ReactSvg className={iconGuide + ' scale(.85)'} />
            <p>A quick guide to start using Master CSS in your React project.</p>
            <h2 id="quick-start">Quick start</h2>
            <h3 id="create-a-project">1. Create a React project</h3>
            <p>
                If you don&#39;t have a React project, create one first. It&#39;s recommended to refer <a href="https://create-react-app.dev/" target="blank">Create React App</a> :
            </p>
            <Code lang="bash">
                {`
                    npx create-react-app __project__ --template typescript
                    cd __project__
                `}
            </Code>
            <h3 id="installation">2. Installation</h3>
            <InstallStyles />
            <h3 id="import">3. Import</h3>
            <Code lang="tsx" name="src/index.tsx">
                {`import '@master/css';`}
            </Code>
            <h3 id="launch-server">4. Launch server</h3>
            <Code lang="bash">
                {`npm start`}
            </Code>
            <h3 id="hello-world">Hello world</h3>
            <HelloWorldSection url="localhost:4200"></HelloWorldSection>
            <Code lang="tsx" name="index.tsx" addLines={[5, 6, 7]} lineNumbers>
                {`
                    import '@master/css';
                    
                    const App = () => {
                      return (
                        <h1 className="font:40 font:heavy italic m:50 text:center">
                            Hello World
                        </h1>
                      )
                    }
                    
                    export default App;
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

const localeNamespace = 'docs.css.react'

React.page = {
    layout: CssDoc,
    title: 'Set up Master CSS in React',
    description: 'A quick guide to start using Master CSS in your React project.',
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