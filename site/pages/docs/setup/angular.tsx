import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Code from '~/components/Code';
import HelloWorldSection from '~/components/Css/HelloWorld';
import InstallStyles from '~/components/Css/InstallStyles';
import CssDoc from '~/layouts/CssDoc';
import AngulartSvg from '~/public/images/frameworks/angular.svg';
import { iconGuide } from '~/styles/icon-guide';

export default function Angular() {
    return (
        <>
            <AngulartSvg className={iconGuide + ' scale(1.05)'} />
            <p>A quick guide to start using Master CSS in your Angular project.</p>
            <h2 id="quick-start">Quick start</h2>
            <h3 id="create-a-project">1. Create a Angular project</h3>
            <p>
                If you don&#39;t have a Angular project, create one first. It&#39;s recommended to refer <a href="https://angular.io/cli" target="blank">Angular CLI</a> :
            </p>
            <Code lang="bash">
                {`
                    ng new __project__
                    cd __project__
                `}
            </Code>
            <h3 id="installation">2. Installation</h3>
            <InstallStyles />
            <h3 id="configure-angularjson">3. Configure angular.json</h3>
            <p>
                The Angular CLI <a href="https://angular.io/guide/build#configuring-commonjs-dependencies" target="blank">outputs warnings</a> if 
                it detects that your browser application depends on CommonJS modules.
            </p>
            <Code lang="ts" lines="true" name="angular.json" addLines={[5]} lineNumbers>
                {`
                    "build": {
                        "builder": "@angular-devkit/build-angular:browser",
                        "options": {
                            "allowedCommonJsDependencies": [
                                "@master/css"
                            ]
                            …
                        }
                        …
                    },
                `}
            </Code>

            <h3 id="import">4. Import</h3>
            <Code lang="ts" name="src/main.ts" addLines={[1]} lineNumbers>
                {`
                    import '@master/css';
                    import { enableProdMode } from '@angular/core';
                `}
            </Code>
            <h3 id="launch-server">5. Launch server</h3>
            <Code lang="bash">
                {`ng serve`}
            </Code>
            <h3 id="hello-world">Hello world</h3>
            <HelloWorldSection url="localhost:4200"></HelloWorldSection>
            <Code lang="html" name="app.component.html">
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
            </p> */}
            <Code lang="ts" name="server.ts" addLines={[1,2,3,44]} lineNumbers>
                {`
                    import '@master/css';
                    import { Style, StyleSheet } from '@master/css';
                    import { render } from '@master/css/render';
                    import { APP_BASE_HREF } from '@angular/common';
                    import * as express from 'express';
                    import { join } from 'path';
                    import { existsSync } from 'fs';
                    import { AppServerModule } from './src/main.server';
                    import { ngExpressEngine } from '@nguniversal/express-engine';

                    let DIST_BROWSER_FOLDER = join(process.cwd(), 'dist/docs/browser')
                    if (!existsSync(DIST_BROWSER_FOLDER)) {
                        DIST_BROWSER_FOLDER = join(process.cwd(), 'browser')
                    }

                    export function app(): express.Express {

                        const server = express()
                        const indexHtml = existsSync(join(DIST_BROWSER_FOLDER, 'index.original.html')) 
                            ? 'index.original.html' 
                            : 'index';

                        server.engine('html', ngExpressEngine({
                            bootstrap: AppServerModule
                        }))

                        server.set('view engine', 'html')
                        server.set('views', DIST_BROWSER_FOLDER)

                        server.get('*.*', express.static(DIST_BROWSER_FOLDER, {
                            maxAge: '1d'
                        }))
                        
                        server.get('*', (req, res) => {
                            res.render(indexHtml, {
                                req,
                                providers: [
                                    { provide: APP_BASE_HREF, useValue: req.baseUrl }
                                ]
                            }, (error: Error, html: string) => {
                                if (error) {
                                    console.error(error)
                                } else {
                                    res.send(render(html, { StyleSheet }).html)
                                }
                            })
                        })
                    }
                `}
            </Code>
        </>
    )
}

const localeNamespace = 'docs.css.angular'

Angular.page = {
    layout: CssDoc,
    title: 'Set up Master CSS in Angular',
    description: 'A quick guide to start using Master CSS in your Angular project.',
    suffix: '',
    h1ClassName: 'mr:110',
    subtitle: 'Getting Started',
    editors: ['Aron'],
    localeNamespace
};

export async function getStaticProps({ locale }: any) {
    return {
        props: {
            ...(await serverSideTranslations(locale, ['common', 'css', localeNamespace])),
        },
    };
};
