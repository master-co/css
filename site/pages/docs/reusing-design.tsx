/* eslint-disable @next/next/no-img-element */
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Code from '~/components/Code';
import CssDoc from '~/layouts/CssDoc'
import Link from '~/components/Link';
import CodeTabs from '~/components/Code/CodeTabs';
import { users } from '~/data/users';

const buttonClassNames = 'inline-flex center-content font:14 font:semibold font:white bg:indigo px:18 h:40 r:4'

export default function ReusingDesign({ t }: any) {
    return (
        <>
            <p>This guide helps develop concepts for code reuse and de-duplication techniques.</p>
            <p>As styles grow, you will gradually find similar class name combinations and the same designs repeated across your codebase.</p>

            <h2 id="abstract-styles">Abstract styles</h2>
            <p>When the same composition of styles has the potential to be reused, consider abstracting it.</p>
            <p>Avoid abstracting styles of an element prematurely in an attempt to make it look cleaner or reduce code length.</p>

            <h3 id="abstracted-into-class-names">Abstracting into reusable class names</h3>
            <p>As an example of Master&#39;s API for abstracting styles, let&#39;s extract this button&#39;s styles into a reusable class name.</p>
            <div className="demo">
                <button className={buttonClassNames}>
                    Submit
                </button>
            </div>
            <Code lang="html" removeLines={[1]} addLines={[2]} lineNumbers>{`
                <button class="${buttonClassNames}">Submit</button>
                <button class="btn">Submit</button>
            `}</Code>
            <Code lang="js" name="styles/master.css.js" lineNumbers addLines={[4]}>{`
                import { init, Style } from '@master/css';

                Style.extend('classes', {
                    btn: '${buttonClassNames}'
                })

                init()
            `}</Code>
            <p>
                For the configuration guide, check out <Link href="/docs/customization">Customization Reference</Link>.
            </p>
            <p>Appropriate use of this API and reusing components of the same style can make the application&#39;s design more consistent, and reduce repeated code.</p>
            <p>If abused, excessive abstraction will result in rapid increases in output size. The outputed CSS rules:</p>
            <Code lang="css" lineNumbers>{`
                .btn, .inline-flex { display: flex }
                .btn, .font\:14 { font-size: 0.875rem }
                /* ... */
            `}</Code>

            <h3 id="abstracted-into-elements">Abstracting into elements</h3>
            <p>We&#39;ve provided a syntactic sugar <a href="https://github.com/master-co/style-element.react" target="blank">@master/style-element.react</a>, allowing you to quickly build a styled element for reuse.</p>
            <Code name="App.jsx" lang="jsx" lineNumbers addLines={[4, 8, 9]}>{`
            import React from 'react';
            import el from '@master/style-element.react';

            const Button = el.button\`${buttonClassNames}\`;

            export default function App() {
                return (
                    <Button className="uppercase">...</Button>
                    <Button className="capitalize">...</Button>
                );
            }
            `}</Code>
            <p>rendered as:</p>
            <Code lang="html">{`
                <button class="uppercase ${buttonClassNames}">...</button>
                <button class="capitalize ${buttonClassNames}">...</button>
            `}</Code>
            <p>We expect to support React, Vue, and any other frameworks.</p>

            <h3 id="abstracted-into-components">Abstracting into components</h3>
            {/* <p>Locally reuse and de-duplicate consecutive class names and designs.</p> */}
            <p>Abstract into reusable components for front-end frameworks such as React, Vue, and Angular, or use a templating language like Ejs, Twig, or Handlebars, etc.</p>
            <CodeTabs>{[
                {
                    name: 'Button.jsx', lang: 'jsx', lineNumbers: true,
                    code: `
                        import clsx from 'clsx'; // A tiny utility for constructing className strings conditionally.

                        export default function Button(props) {
                            return (
                                <button {...props} className={clsx('${buttonClassNames}', props.className)}>
                                    {props.children}
                                </button>
                            )
                        }
                    `
                },
                {
                    name: 'Button.vue', lang: 'html', lineNumbers: true,
                    code: `
                        <template>
                            <button class="${buttonClassNames}">
                                <slot></slot>
                            </button>
                        </template>
                    `
                },
                {
                    name: 'button.component.js', lang: 'js', lineNumbers: true,
                    code: `
                        import { Component } from '@angular/core'

                        @Component({
                            selector: 'app-button',
                            template: \`
                                <button class="${buttonClassNames}">
                                    <ng-content></ng-content>
                                </button>
                            \`
                        })
                        export class ButtonComponent {}
                    `
                }
            ]}</CodeTabs>

            <h2 id="deduplication-programming">Deduplication programming</h2>
            <p>To reduce code repetition, you can make use of functional programming and a well-designed architecture.</p>
            <h3 id="extract-items-into-loops">Extract items into loops</h3>
            <p>Reduce code repetition using loops in a front-end framework like React, Vue, and Angular, or use a template language like Ejs, Twig, or Handlebars, etc.</p>
            <div className="demo">
                {users.map((user) =>
                    <img className="mx:-3 w:48 h:48 round object:cover outline:3|solid|white outline:gray-18@dark" src={user.url} alt={user.name} key={user.name} loading="lazy" decoding="async" />
                )}
            </div>
            <Code name="Team.tsx" lang="tsx" lineNumbers removeLines={[2, 3, 4, 5, 6]} addLines={[7, 8, 9]}>{`
                <div className="flex">
                    <img className="mx:-3 w:48 h:48 round object:cover outline:3|solid|white outline:gray-18@dark" src="/images/users/aron.jpg" alt="aron">
                    <img className="mx:-3 w:48 h:48 round object:cover outline:3|solid|white outline:gray-18@dark" src="/images/users/joy.jpg" alt="joy">
                    <img className="mx:-3 w:48 h:48 round object:cover outline:3|solid|white outline:gray-18@dark" src="/images/users/miles.jpg" alt="miles">
                    <img className="mx:-3 w:48 h:48 round object:cover outline:3|solid|white outline:gray-18@dark" src="/images/users/benseage.jpg" alt="benseage">
                    <img className="mx:-3 w:48 h:48 round object:cover outline:3|solid|white outline:gray-18@dark" src="/images/users/lola.jpg" alt="lola">
                    {users.map((user) =>
                        <img className="mx:-3 w:48 h:48 round object:cover outline:3|solid|white outline:gray-18@dark" src={user.url} alt={user.name} key={user.name} />
                    )}
                </div>
            `}</Code>
        </>
    )
}

const localeNamespace = 'docs.css.reusing-design'

ReusingDesign.page = {
    layout: CssDoc,
    title: 'Reusing Design',
    description: 'This guide helps develop concepts for code reuse and de-duplication techniques.',
    editors: ['Aron'],
    type: 'article',
    localeNamespace
};

export async function getStaticProps({ locale }: any) {
    return {
        props: {
            ...(await serverSideTranslations(locale, ['common', 'css', localeNamespace])),
        },
    };
}
