import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Code from '~/components/Code'
import CssDoc from '~/layouts/CssDoc'

// TODO: 把該頁所有 section 拆成 comopnents 讓各個頁面可以單獨引入自己的 customization 說明

export default function Customization() {
    return (
        <CssDoc title="Customization" authors={['Aron']}>
            <p>Customizing and configuring your Master CSS installation.</p>
            <a href="https://stackblitz.com/edit/mastercss-customization-example?file=styles%2Fmaster.css.js" target="blank">Master CSS Customization Example - StackBlitz</a>
            <h2 id="configuration-guide">Configuration Guide</h2>
            <p>
                In general, frameworks or standard directory structures come with a <code>./styles</code> folder for css files, and we recommend placing/configurating Master CSS styles here.
            </p>
            <Code lang="treeview">{/* html */ `
                styles/
                |-- other.css
                |-- home.js
                |-- master.css.js
            `}</Code>
            <h3 id="create-master-css-js-file">1. Create `master.css.js` file</h3>
            <p>It&#39;s recommended to create a <code>master.css.js</code> to centrally initialize and manage configurations.</p>
            <Code lang="js" name="styles/master.css.js" lineNumbers>{`
                /* 1. Access APIs */
                import { init, Style } from '@master/css';

                /* 2. Configure your initial options here ... */
                Style.extend('classes', 
                    {
                        btn: 'font:14 text:center h:40'
                    },
                    require('./home')
                );

                /* 3. Manually initialize */
                init();
            `}</Code>
            <p>Take a look at how the official defines <code>home.js</code> with classes.</p>
            <Code lang="js" name="styles/home.js" lineNumbers>{`
                module.exports = {
                    homeTitle: 'font:28 font:36@md font:extrabold ls:-.25',
                    homeContainer: 'max-w:1280 px:20 px:40@md mx:auto',
                    ...
                }
            `}</Code>
            <p>Of course, you can do all the configuration directly in <code>styles/master.css.js</code>, but as the configuration grows you may want to organize it into different files.</p>
            <h3 id="create-a-configuration-file">2. Prevent initializing automatically</h3>
            <p>The Master CSS preset is enabled with zero configuration, once you want to customize the configuration you must prevent automatic initialization and re-rendering.</p>
            <Code lang="html" name="index.html" lineNumbers addLines={[2, 3, 4]}>{`
                <head>
                    <script>
                        window.MasterCSSManual = true;
                    </script>
                    <script src="/main.js" defer></script>
                    ...
                </head>
                ...
            `}</Code>
            <h3 id="import-into-your-entry-file">3. Import into your entry file</h3>
            <p>Import master.css.js into the entry file of the application, take the common <code>main.js</code> as an example.</p>
            <Code lang="js" name="main.js">{`
                import './styles/master.css';
            `}</Code>
            <h3 id="other-directly-in-index-html">Other. Directly in index.html</h3>
            <p>Here&#39;s a quick way to start with HTML only by copying and pasting:</p>
            <Code lang="html" name="index.html" lineNumbers>{/* html */ `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <link href="https://unpkg.com/@master/normal.css" rel="stylesheet">
                    <script>
                        /* 1. Prevent @master/css from initializing automatically */
                        window.MasterCSSManual = true;
                    </script>
                    <script src="https://cdn.master.co/css"></script>
                    <script >
                        /* 2. Configure your initial options here ... */
                        const Style = window.MasterStyle;
                        Style.extend('classes', {
                            btn: 'font:14 text:center h:40 px:20'
                        })
                        /* 3. Manually initialize */
                        window.initMasterCSS()
                    </script>
                </head>
                <body>
                    <button class="btn">Ok</button>
                </body>
                </html>
            `}</Code>

            <h2 id="global-settings">Global settings</h2>
            <p>Use <code>Style.extend(property, ...settings)</code> to extend <code>&#39;classes&#39;</code>, <code>&#39;colors&#39;</code>, <code>&#39;breakpoints&#39;</code>, <code>&#39;mediaQueries&#39;</code> globally.</p>

            <h3 id="classes">Classes</h3>
            <p>Abstract and reuse your styles with the class names as usual:</p>
            <Code lang="js" name="styles/master.css.js" lineNumbers>{`
                import { init, Style } from '@master/css';

                Style.extend('classes', {
                    btn: 'font:14 h:40 h:32.sm text:center bg:red:hover',
                    card: 'p:20 b:1|solid|gray-80 bg:white'
                });

                init();
            `}</Code>
            <p>Using them in your HTML would look like this:</p>
            <Code lang="html" lineNumbers>{`
                <button class="**btn** ..."></button>
                <div class="**card** ..."></div>
            `}</Code>

            <h3 id="colors">Colors</h3>
            <p>Extend additional colors and overwrite/keep defaults:</p>
            <Code lang="js" name="styles/master.css.js" lineNumbers>{`
                import { init, Style } from '@master/css';

                Style.extend('colors', {
                    'tiffany-blue': '0abab5',
                    bee: 'f2b413',
                    purple: {
                        '': '491d8b',
                        50: 'a56eff',
                        60: '8a3ffc',
                        70: '6929c4',
                    }
                }

                init();
            `}</Code>
            <p>Using them in your HTML would look like this:</p>
            <Code lang="html">{`
                <p class="font:**tiffany-blue** bg:**bee**"></p>
            `}</Code>

            <h3 id="breakpoints">Breakpoints</h3>
            <p>Extend additional breakpoints and overwrite/keep defaults:</p>
            <Code lang="js" name="styles/master.css.js" lineNumbers>{`
                import { init, Style } from '@master/css';

                Style.extend('breakpoints', {
                    tablet: '768px', // => @media (min-width: 768px) { ... }
                    laptop: '1024px', // => @media (min-width: 1024px) { ... }
                    desktop: '1280px', // => @media (min-width: 1280px) { ... }
                });
                
                init();
            `}</Code>
            <p>Using them in your HTML would look like this:</p>
            <Code lang="html">{`
                <div class="font:24**@tablet** font:32**@laptop** font:48**@desktop**"></div>
            `}</Code>

            <h3 id="media-queries">Media queries</h3>
            <p>Extend media queries and overwrite/keep defaults:</p>
            <Code lang="js" name="styles/master.css.js" lineNumbers>{`
                import { init, Style } from '@master/css';

                Style.extend('mediaQueries', {
                    'watch': '(max-device-width:42mm) and (min-device-width:38mm)'
                });
                
                init();
            `}</Code>
            <p>Using them in your HTML would look like this:</p>
            <Code lang="html">{`
                <div class="text-center**@watch**"></div>
            `}</Code>

            <h3 id="color-schemes">Color Schemes</h3>
            <p>Add additional color schemes:</p>
            <Code lang="js" name="styles/master.css.js" lineNumbers>{`
                import { init, Style } from '@master/css';

                // default: ['light', 'dark']
                Style.colorSchemes.push('ocean');
                
                init();
            `}</Code>
            <p>Using them in your HTML would look like this:</p>
            <Code lang="html">{`
                <div class="bg:cyan-20**@ocean**"></div>
            `}</Code>

            <h2 id="settings-for-each-style">Settings for each style</h2>
            <p>Use <code>Styles.extend(property, ...settings)</code> to extend <code>&apos;values&apos;</code>, <code>&apos;semantics&apos;</code> for different styles.</p>
            <h3 id="values">Values</h3>
            <p>Extend additional values and overwrite/keep defaults:</p>
            <Code lang="js" name="styles/master.css.js" lineNumbers>{`
                import { init, Styles } from '@master/css';

                Styles.extend('values', {
                    width: {
                        '2x': '2rem', // => width: 2rem;
                        '3x': '3rem', // => width: 3rem;
                    }
                });
                
                init();
            `}</Code>
            <p>Using them in your HTML would look like this:</p>
            <Code lang="html">{`
                <div class="width:**2x** w:**4x**"></div>
            `}</Code>
            <p>Use <code>&#39;2x&#39;</code> instead of <code>2</code> as value tokens. Numeric values in measurable styles have conversion behavior.</p>
            <h3 id="semantics">Semantics</h3>
            <p>Extend additional values and overwrite/keep defaults:</p>
            <Code lang="js" name="styles/master.css.js" lineNumbers>{`
                import { init, Styles } from '@master/css';

                Styles.extend('semantics', {
                    display: {
                        show: 'block' // => display: block;
                    },
                    fontSize: {
                        'hide-text': 0 // => font-size: 0rem;
                    }
                })
                
                init();
            `}</Code>
            <p>Using them in your HTML would look like this:</p>
            <Code lang="html">{`
                <div class="**show** **hide-text**" hidden></div>
            `}</Code>
        </CssDoc >
    )
}

const localeNamespace = 'docs.css.customization'

Customization.page = {
    layout: CssDoc,
    title: 'Customization',
    description: 'Customizing and configuring your Master CSS installation.',
    editors: ['Aron'],
    localeNamespace
};

export async function getStaticProps({ locale }: any) {
    return {
        props: {
            ...(await serverSideTranslations(locale, ['common', 'css', localeNamespace])),
        },
    };
}
