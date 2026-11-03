import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Code from '~/components/Code';
import CodeHTML2CSS from '~/components/Code/CodeHTML2CSS';
import ReferenceTable from '~/components/Css/ReferenceTable'
import StyleEditor from '~/components/Css/StyleEditor';
import CssDoc from '~/layouts/CssDoc'

export default function Breakpoints() {

    return (
        <>
            <ReferenceTable
                title="class"
                names={[
                    {
                        name: '@3xs',
                        code: '@media (min-width: 360px) { }',
                        description: 'iPhone 6, 7, 8, X, 11, 12 / Galaxy S8 / HTC One…',
                        hiddenRef: true
                    },
                    {
                        name: '@2xs',
                        code: '@media (min-width: 480px) { }',
                        description: 'Blackberry Passport / Amazon Kindle Fire HD 7 …',
                        hiddenRef: true
                    },
                    {
                        name: '@xs',
                        code: '@media (min-width: 600px) { }',
                        description: 'LG G Pad 8.3 / Amazon Kindle Fire …',
                        hiddenRef: true
                    },
                    {
                        name: '@sm',
                        code: '@media (min-width: 768px) { }',
                        description: 'Microsoft Surface / iPad Pro 9.7 / iPad Mini …',
                        hiddenRef: true
                    },
                    {
                        name: '@md',
                        code: '@media (min-width: 1024px) { }',
                        description: 'iPad Pro 12.9 / Microsoft Surface Pro 3 …',
                        hiddenRef: true
                    },
                    {
                        name: '@lg',
                        code: '@media (min-width: 1280px) { }',
                        description: 'Google Chromebook Pixel / Samsung Chromebook …',
                        hiddenRef: true
                    },
                    {
                        name: '@xl',
                        code: '@media (min-width: 1440px) { }',
                        description: 'Macbook Air 2020 M1 / MacBook Pro 15 …',
                        hiddenRef: true
                    },
                    {
                        name: '@2xl',
                        code: '@media (min-width: 1600px) { }',
                        description: 'Dell Inspiron 14 series …',
                        hiddenRef: true
                    },
                    {
                        name: '@3xl',
                        code: '@media (min-width: 1920px) { }',
                        description: 'Dell UltraSharp U2412M / Dell S2340M / Apple iMac 21.5-inch …',
                        hiddenRef: true
                    },
                    {
                        name: '@4xl',
                        code: '@media (min-width: 2560px) { }',
                        description: 'Dell UltraSharp U2711 / Apple iMac 27-inch …',
                        hiddenRef: true
                    }
                ]}>
            </ReferenceTable>

            <h2 id="Overview">Overview</h2>
            <p>
                Master uses an intelligent matching algorithm to make <b>all styles support responsive breakpoints</b>.
                <br />
                You hardly need to think or sort your media rules in CSS because the Master rules engine intelligently sorts your media rules based on breakpoints and ranges.
            </p>

            <h2 id="basic-usage">Basic usage</h2>
            <h3 id="responsive-styles">Responsive styles</h3>
            <CodeHTML2CSS>{`
                <body class="text:center**@xs**">...</body>
            `}</CodeHTML2CSS>

            <h3 id="operators">Operators</h3>
            <p>
                Operators : <code>&lt;</code>, <code>&lt;=</code>, <code>&lt;</code>, <code>&lt;=</code>
            </p>
            <CodeHTML2CSS>{`
                <div class="font:16**@<xs**">...</div>
                <div class="font:16**@<=xs**">...</div>
                <div class="font:16**@xs**">...</div>
                <div class="font:16**@>xs**">...</div>
                <div class="font:16**@>=xs**">...</div>
            `}</CodeHTML2CSS>

            <h3 id="ranges">Ranges</h3>
            <p>
                This can be very useful sometimes when you need to fine-tune styles for a specific viewport range of devices.
            </p>
            <CodeHTML2CSS>{`
                <div class="font:16**@xs&<sm**">...</div>
            `}</CodeHTML2CSS>

            <h3 id="arbitrary">Arbitrary</h3>
            <p>
                If no unit is set, regarded as <strong>px</strong> automatically.
                <br />
                Sometimes you need to fine-tune the layout for a specific viewport size, in which case you can use a one-time arbitrary value.
            </p>
            <CodeHTML2CSS>{`
                <div class="font:16**@<789**">...</div>per
                <div class="font:16**@<=789**">...</div>
                <div class="font:16**@>=789**">...</div>
                <div class="font:16**@>789**">...</div>
            `}</CodeHTML2CSS>

            <h2 id="javascript-programming">Javascript programming</h2>
            <h3 id="conditionally-apply-with-breakpoints">Conditionally apply with breakpoints</h3>
            <Code lang="js">{`
                import { breakpoints } from '@master/css';
                
                if (window.innerWidth >= breakpoints.md) {
                    // ... 
                }
            `}</Code>

            <h2 id="design-pattern">Design Pattern</h2>
            <p>
                Non-breakpoint styles will apply to all devices.
                <br />
                On the premise that the viewport width is at least 0,
                and <strong>the viewport size will only grow in the future</strong>, taking <code>font-size</code> as an example:
            </p>
            <ul>
                <li>
                    <p>Set an element with <code>font:12</code>, which will apply to all devices.</p>
                </li>
                <li>
                    <p>Set an element with <code>font:12 font:24@sm</code>, then <code>font:12</code> will apply to small devices
                        and <code>font:24@sm </code>will apply to devices with viewport <code>&gt;=576px</code>.</p>
                </li>
            </ul>
            <p>
                You can observe that after adding other sizes with breakpoints to <code>font-size</code>,
                the original non-breakpoint size will be relocated for small devices,
                which is the behavior of <b>mobile-first design</b>.
            </p>
            <h3 id="launch-from-mobile">Launch business from mobile</h3>
            <p>
                Stack styles by breakpoints from small to large.
            </p>

            <p>1 column on iPhone SE</p>
            <Code lang="html">
                {`
                    <div class="**grid-cols:1** …"></div>
                `}
            </Code>
            
            <p>and 2 columns on iPhone 6, 7, 8, X</p>
            <Code lang="html">
                {`
                    <div class="grid-cols:1 **grid-cols:2@3xs** …"></div>
                `}
            </Code>
            <p>and 3 columns on Kindle Fire HD 7 </p>
            <Code lang="html">
                {`
                    <div class="grid-cols:1 grid-cols:2@3xs **grid-cols:3@2xs** …"></div>
                `}
            </Code>
            <p>and 4 columns on Kindle Fire</p>
            <Code lang="html">
                {`
                    <div class="grid-cols:1 grid-cols:2@3xs grid-cols:3@2xs **grid-cols:4@xs** …"></div>
                `}
            </Code>
            <p>and 5 columns on iPad Pro 9.7</p>
            <Code lang="html">
                {`
                    <div class="grid-cols:1 grid-cols:2@3xs grid-cols:3@2xs grid-cols:4@xs **grid-cols:5@sm** …"></div>
                `}
            </Code>
            <p>and so on …</p>

            <h3 id="launch-from-desktop">Launch from desktop</h3>
            <p>
                Set breakpoints for styles from large to small.
            </p>
            <p>Your beginning is 6 columns for iMac 27</p>
            <Code lang="html">
                {`
                    <div class="**grid-cols:6** …"></div>
                `}
            </Code>
            <p>Now, explicitly designate 6 columns for iMac 27</p>
            <Code lang="html">
                {`
                    <div class="**grid-cols:6@4xl** …"></div>
                `}
            </Code>
            <p>and 5 columns on Dell XPS 13</p>
            <Code lang="html">
                {`
                    <div class="grid-cols:6@4xl **grid-cols:5@3xl** …"></div>
                `}
            </Code>
            <p>and 4 columns on Dell Inspiron 14 series</p>
            <Code lang="html">
                {`
                    <div class="grid-cols:6@4xl grid-cols:5@3xl **grid-cols:4@2xl** …"></div>
                `}
            </Code>
            <p>and 3 columns on Macbook Air 2020</p>
            <Code lang="html">
                {`
                    <div class="grid-cols:6@4xl grid-cols:5@3xl grid-cols:4@2xl **grid-cols:3@xl** …"></div>
                `}
            </Code>
            <p>and so on …</p>
        </>
    )
}

const localeNamespace = 'docs.css.breakpoints'

Breakpoints.page = {
    layout: CssDoc,
    title: 'Breakpoints',
    description: 'Master uses an intelligent matching algorithm to make all styles support responsive breakpoints.',
    editors: ['Aron', 'Lola'],
    localeNamespace
};

export async function getStaticProps({ locale }: any) {
    return {
        props: {
            ...(await serverSideTranslations(locale, ['common', 'css', localeNamespace])),
        },
    };
}
