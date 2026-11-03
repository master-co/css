import Code from '~/components/Code'
import HelloWorldSection from '~/components/Css/HelloWorld'
import InstallStyles from '~/components/Css/InstallStyles'
import CssDoc from '~/layouts/CssDoc'
import WebpackSvg from '~/public/images/build-tools/webpack.svg'
import { iconGuide } from '~/styles/icon-guide'
import CodeTabs from '~/components/Code/CodeTabs'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

export default function Webpack() {
    return (
        <>
            <WebpackSvg className={iconGuide + ' scale(1.4)'} />
            <p>Here&#39;s a quick guide to set up Master CSS in Webpack.</p>
            <h2 id="quick-start">Quick start</h2>
            <h3 id="create-a-project">1. Create a Webpack project</h3>
            <p>
                If you don&#39;t have a Webpack project, create one first. It&#39;s recommended to refer <a href="https://webpack.js.org/guides/getting-started" target="blank">Getting Started</a> :
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
                    code: 'npm init -y \n npm install webpack webpack-cli webpack-dev-server html-webpack-plugin --save-dev'
                },
                {
                    name: 'yarn', lang: 'bash',
                    code: 'yarn init -y \n yarn add --dev webpack webpack-cli webpack-dev-server html-webpack-plugin'
                }
            ]}</CodeTabs>
            <h3 id="installation">2. Installation</h3>
            <InstallStyles />
            <h3 id="import">3. Import</h3>
            <p>
                Create a <code>index.html</code> and <code>src/index.js</code>.
            </p>
            <Code lang="js" name="src/index.js" lineNumbers>
                {`
                    import '@master/css';
                `}
            </Code>
            <Code lang="html" name="index.html" lineNumbers addLines={[6]}>
                {`
                   <!doctype html>
                   <html lang="en">
                   <head>
                       <meta charset="utf-8" />
                       <title>Getting Started</title>
                       <script src="./src/index.js"></script>
                       ...
                   </head>
                   </html>
                `}
            </Code>

            <h3 id="configure">4. Configure</h3>
            <p>
                Install <code>package.json</code>.
            </p>
            <Code lang="js" name="package.json" lineNumbers>
                {`
                   {
                    "name": "project",
                    "scripts": {
                      "start": "npx webpack serve",
                      "build": "webpack --mode production"
                    },
                    ...
                  }
                  
                `}
            </Code>
            <p>
                Install <code>webpack.config.js</code>.
            </p>
            <Code lang="js" name="webpack.config.js" lineNumbers>
                {`
                    const path = require('path');
                    const HtmlWebpackPlugin = require("html-webpack-plugin");
                    
                    module.exports = {
                        entry: './src/index.js',
                        output: {
                            filename: 'bundle.js',
                            path: path.resolve(__dirname, 'dist')
                        },
                        mode: 'production',
                        plugins: [
                            new HtmlWebpackPlugin({
                                template: path.resolve(__dirname, "index.html")
                            })
                        ]
                    };
                `}
            </Code>

            <h3 id="launch-server">5. Launch server</h3>
            <CodeTabs>{[
                {
                    name: 'npx', lang: 'bash',
                    code: 'npx webpack serve'
                },
                {
                    name: 'yarn', lang: 'bash',
                    code: 'yarn start'
                }
            ]}</CodeTabs>
            <h3 id="hello-world">Hello world</h3>
            <HelloWorldSection url="localhost:8080"></HelloWorldSection>
            <Code lang="html" name="index.html" lineNumbers>{`
                <h1 class="**font:40** **font:heavy** **italic** **m:50** **text:center**">
                    Hello World
                </h1>
            `}</Code>

            <h2 id="hybrid-rendering">Hybrid rendering</h2>
            <p>
                We devised a <b>hybrid architecture</b> that allows you to <b>pre-generate CSS from HTML</b> on the server
                side, and then continue to use <b>JIT</b> on the client side by reverse parsing.
            </p>
            <p><i>More to come ...</i> 🚧</p>
        </>
    )
}

const localeNamespace = 'docs.css.webpack'

Webpack.page = {
    layout: CssDoc,
    title: 'Set up Master CSS in Webpack',
    description: 'A quick guide to start using Master CSS in your Webpack project.',
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