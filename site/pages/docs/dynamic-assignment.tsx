import clsx from 'clsx';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useState } from 'react';
import Code from '~/components/Code';
import CodeTabs from '~/components/Code/CodeTabs';
import CssDoc from '~/layouts/CssDoc'
import Switch from '~/components/Switch';

export default function ReusingDesign({ t }: any) {
    const [size, setSize] = useState(70)
    const [flipped, setFlipped] = useState(true)
    const code = `
        <div class="font:teal-**${size}** font:purple-**${size}**:hover font:96 font:heavy">Aa</div>
    `
    return (
        <>
            <p>Implement styles with more flexibility, using dynamic variables.</p>
            <h2 id="dynamically-assign-values">Dynamically assign values</h2>
            <p>Dynamic assignment is applicable to all styles, so you can assign even after fetching data from the server.</p>
            <div className="demo flex:col">
                <div className={`font:teal-${size} font:purple-${size}:hover font:96 font:heavy`}>Aa</div>
                <input type="range" defaultValue={size} min="2" max="98" step="2"
                    onInput={(event: any) => {
                        setSize(event.target.value)
                    }}
                    className="inputSlider max-w:150 w:full mb:30" />
            </div>
            <Code lang="html" className="w:full mt:auto">{code}</Code>
            <p>
                Dynamically assign values with a front-end framework like React, Vue, and Angular.
            </p>
            <CodeTabs>{[
                {
                    name: 'react', lang: 'tsx',
                    code: `
                        <div className={\`font:teal-\$\{size\} font:purple-\$\{size\}:hover font:96 font:heavy\`}>Aa</div>
                    `
                },
                {
                    name: 'angular', lang: 'html',
                    code: `
                        <div class="font:teal-{{size}} font:purple-{{size}}:hover font:96 font:heavy">Aa</div>
                    `
                },
                {
                    name: 'vue', lang: 'html',
                    code: `
                        <div :class="\`font:teal-\$\{size\} font:purple-\$\{size\}:hover font:96 font:heavy\`">Aa</div>
                    `
                },
            ]}</CodeTabs>

            <h2 id="conditionally-apply-class-names">Conditionally apply class names</h2>
            <p>To conditionally manipulate class names, you can use vanilla JS or any technique specific to your framework.</p>
            <div className="demo flex:col">
                <div className={clsx('~transform|.3s font:96 font:heavy font:96 font:heavy', {
                    'scaleX(-1)': flipped
                })}>
                    Aa
                </div>
                <Switch defaultValue={flipped} onInput={() => setFlipped(!flipped)} />
            </div>
            <Code lang="html" className="w:full mt:auto">{`
                <div class="${flipped ? '**scaleX(-1)** ' : ''}~transform|.3s font:96 font:heavy font:96 font:heavy">Aa</div>
            `}</Code>
            <p>Conditionally apply class names with a front-end framework like React, Vue, and Angular.</p>
            <CodeTabs>{[
                {
                    name: 'react', lang: 'tsx',
                    code: `
                        <div className={(flipped ? 'scaleX(-1) ' : '') + '~transform|.3s font:96 font:heavy font:96 font:heavy'}>Aa</div>
                    `
                },
                {
                    name: 'angular', lang: 'html',
                    code: `
                        <div [ngClass]="{'scaleX(-1)': flipped}" class="~transform|.3s font:96 font:heavy font:96 font:heavy">Aa</div>
                    `
                },
                {
                    name: 'vue', lang: 'html',
                    code: `
                        <div :class="[{'scaleX(-1)': flipped}, '~transform|.3s font:96 font:heavy font:96 font:heavy']">Aa</div>
                    `
                },
            ]}</CodeTabs>
        </>
    )
}

const localeNamespace = 'docs.css.dynamic-assignment'

ReusingDesign.page = {
    layout: CssDoc,
    title: 'Dynamic Assignment',
    description: 'Implement styles with more flexibility, using dynamic variables.',
    editors: ['Aron'],
    localeNamespace,
    type: 'article'
};

export async function getStaticProps({ locale }: any) {
    return {
        props: {
            ...(await serverSideTranslations(locale, ['common', 'css', localeNamespace])),
        },
    };
}
