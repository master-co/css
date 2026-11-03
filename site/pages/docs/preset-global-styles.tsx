import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Code from '~/components/Code';
import CodeTabs from '~/components/Code/CodeTabs';
import Link from '~/components/Link';

import CssDoc from '~/layouts/CssDoc'

export default function PresetGlobalStyles({ t }: any) {
    return (
        <>
            <p>Normalizing browsers and presetting global styles make subsequent style programming neater.</p>
            <h2 id="setup">Setup</h2>
            <h3 id="download">Download</h3>
            <CodeTabs>{[
                {
                    name: 'npm', lang: 'bash',
                    code: 'npm install **@master/normal.css**'
                },
                {
                    name: 'yarn', lang: 'bash',
                    code: 'yarn add **@master/normal.css**'
                },
                {
                    name: 'pnpm', lang: 'bash',
                    code: 'pnpm install **@master/normal.css**'
                }
            ]}</CodeTabs>
            <p>Import into your global CSS file:</p>
            <Code lang="css" name="main.css">
                {`@import '@master/normal.css';`}
            </Code>
            <h3 id="CDN">CDN</h3>
            <Code lang="html" addLines={[6]} name="index.html" lineNumbers>
                { /* html */`
                    <!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="utf-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1">
                        <link href="https://cdn.master.co/normal.css" rel="stylesheet">
                    </head>
                    </html>
                `}
            </Code>
            <h2 id="features">Features</h2>
            <p>
                Here are some optimizations and presets made by <code>@master/normal.css</code>, the complete code is <a href="https://github.com/master-co/normal.css/blob/main/src/index.scss" target="blank">here</a>.
            </p>
            <p>If you want to stay lazy, you can use it without even knowing the behavior behind it!</p>
            <h3 id="geometric-precision-rendering-for-prettier-text">Geometric precision rendering for prettier text</h3>
            <Code lang="css" lineNumbers>{`
                * {
                    text-rendering: geometricPrecision;
                }
            `}</Code>
            <h3 id="Antialiased font smoothing looks great">Antialiased font smoothing looks great</h3>
            <Code lang="css" lineNumbers>{`
                body {
                    -moz-osx-font-smoothing: grayscale;
                    -webkit-font-smoothing: antialiased;
                }
            `}</Code>
            <h3 id="standard-css-font-variables-and-presets">Standard CSS font variables and presets</h3>
            <Code lang="css" lineNumbers>{`
                :root {
                    --font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, Noto Sans, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol, Noto Color Emoji;
                    --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace;
                    --font-serif: ui-serif, Georgia, Cambria, Times New Roman, Times, serif;
                }

                body {
                    font-family: var(--font-sans);
                }

                code,
                kbd,
                samp {
                    font-family: var(--font-mono);
                }
            `}</Code>
            <h3 id="remove-margins-and-padding-from-certain-elements">Remove margins and padding from certain elements</h3>
            <Code lang="css" lineNumbers>{`
                body,
                blockquote,
                dl,
                dd,
                h1,
                h2,
                h3,
                h4,
                h5,
                h6,
                hr,
                figure,
                p,
                button,
                optgroup,
                select,
                textarea,
                pre {
                    margin: 0;
                }

                td,
                legend,
                textarea,
                input,
                fieldset {
                    padding: 0;
                }

                ul,
                ol {
                    margin: 0;
                    padding: 0;
                }
            `}</Code>
            <h3 id="uniform-box-sizing-calculation">
                Uniform box sizing calculation
            </h3>
            <Code lang="css" lineNumbers>{`
                *,
                ::before,
                ::after {
                    box-sizing: border-box;
                }
            `}</Code>
            <h3 id="neutral-typography-and-formatting">Neutral typography and formatting</h3>
            <Code lang="css" lineNumbers>{`
                body {
                    line-height: 1.2;
                    text-size-adjust: 100%;
                    -webkit-text-size-adjust: 100%;
                    -moz-text-size-adjust: 100%;
                    -ms-text-size-adjust: 100%;
                    -moz-tab-size: 4;
                    tab-size: 4;
                }

                b,
                strong {
                    font-weight: bolder;
                }

                small {
                    font-size: 80%;
                }

                sub,
                sup {
                    font-size: 75%;
                    line-height: 0;
                    position: relative;
                    vertical-align: baseline;
                }

                sub {
                    bottom: -0.25em;
                }

                sup {
                    top: -0.5em;
                }

                ul {
                    list-style: none;
                }
                
                hr {
                    height: 0;
                    color: inherit;
                }
            `}</Code>
            <h3 id="preset-some-elements-as-block">Preset some elements as block</h3>
            <Code lang="css" lineNumbers>{`
                img,
                svg,
                video,
                canvas,
                audio,
                iframe,
                embed,
                object {
                    display: block;
                }
            `}</Code>
        </>
    )
}

const localeNamespace = 'docs.css.preset'

PresetGlobalStyles.page = {
    layout: CssDoc,
    title: 'Preset and normalize global styles.',
    description: 'Normalizing browsers and presetting global styles make subsequent style programming neater.',
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
