import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'
import StyleEditor from '~/components/Css/StyleEditor'
import ShorthandList from '~/components/Css/ShorthandList'
import BoxList from '~/components/Css/BoxList'
import Code from '~/components/Code'
import CodeTabs from '~/components/Code/CodeTabs'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

export default function Animation() {

    return (
        <>
            <ClassTable names={[
                ['animation:`name`|`duration`|`…`', '@`name`|`duration`|`…`']
            ]}>
            </ClassTable>
            <p className="hint">
                The animation property may be specified using one or more of the values (animation-name, animation-duration, …). The order of the values does not matter.
            </p>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>animation</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/Shorthand_properties" target="blank">shorthand property</a>&nbsp;
                applies an animation between styles.
                <br/>
                <br/>
                It is a shorthand for:
            </p>
            <ShorthandList items={[
                'animation-delay',
                'animation-direction',
                'animation-duration',
                'animation-fill-mode',
                'animation-iteration-count',
                'animation-name',
                'animation-play-state',
                'animation-timing-function'
            ]}>
            </ShorthandList>
            <h2 id="official-keyframes">Official keyframes</h2>
            <p>
                We provide a set of keyframes commonly used:
            </p>
            <BoxList
                showClasses={[
                    '@fade|1s|infinite',
                    '@ping|1s|infinite',
                    '@flash|1s|infinite',
                    '@heart|1s|infinite',
                    '@jump|1s|infinite',
                    '@pulse|1s|infinite',
                    '@rotate|1s|infinite',
                    '@shake|1s|infinite',
                    '@zoom|1s|infinite',
                    '@float|3s|ease-in-out|infinite'
                ]}
                renderClasses="b:5|solid|blue-60 my:50!">
            </BoxList>
            <h2 id="setup">Setup</h2>
       
            <h3 id="installation">1. Installation</h3>
            <CodeTabs>
                {[
                    {
                        name: 'npm', lang: 'bash',
                        code: 'npm install **@master/keyframes.css**'
                    },
                    {
                        name: 'yarn', lang: 'bash',
                        code: 'yarn add **@master/keyframes.css**'
                    },
                    {
                        name: 'pnpm', lang: 'bash',
                        code: 'pnpm install **@master/keyframes.css**'
                    }
                    ]}
            </CodeTabs>
            <h3 id="import">2. Import</h3>
            <Code lang="css" name="main.css">
                {`@import '@master/keyframes.css';`}
            </Code>
            <p>or import only your demand</p>
            <Code lang="css" name="main.css">
                {`@import '@master/keyframes.css/fade';`}
            </Code>
            <p>or import via CDN</p>
            <Code lang="html" name="index.html" addLines={[1,5]}>
                {`
                    <link href="https://unpkg.com/@master/keyframes.css" rel="stylesheet">
                    
                    <!-- or import only your demand -->
                    <link href="https://unpkg.com/@master/keyframes.css/fade.css" rel="stylesheet">
                `}
            </Code>
            <h2 id="basic-usage">Basic usage</h2>
            <h3 id="add-with-custom-keyframes">Add with custom keyframes</h3>
            <p>
                First, define  <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/@keyframes" target="blank">@keyframes</a>&nbsp; 
                in your css file or <code>&lt;style&gt;</code>.
            </p>
            <Code lang="css" name="custom.css">
                {`
                    @keyframes demo {
                        from {
                            left: 0px;
                            top: 0px;
                            background: rgba(83, 140, 238, .2);
                            border-color: rgb(83, 140, 238);
                        }
                    
                        to {
                            left: 150px;
                            top: 0px;
                            background: rgba(235, 95, 99, .5);
                            border-color: rgb(235, 95, 99);
                        }
                    }
                `}
            </Code>
            <p>
                Now, set the animation classes for the element.
            </p>
            <StyleEditor
                tag="div"
                className="@demo|ease-in|1s|infinite|alternate"
                showCss="true"
                hideHtml="true"
                renderHtml={(className: string) => `
                <div class="..grid-cols:1 gap:20 w:full h:200..">
                    <div class="${className} f:12! w:100 h:100 m:auto bg:blue-60/.2 r:5 b:5|solid|blue-60"></div>
                </div>
                `} />

            <StyleFunctions name="animation:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="animation:fade:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="animation:fade@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="animation:fade@print"></StyleMediaQueries>
            <StyleColorSchemes name="animation:fade@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.animation'

Animation.page = {
    layout: CssDoc,
    title: 'Animation',
    description: 'The animation CSS shorthand property  applies an animation between styles.',
    editors: ['Aron','Lola'],
    localeNamespace
,
    mdn: true,
    canIUse: true
};

export async function getStaticProps({ locale }: any) {
    return {
        props: {
            ...(await serverSideTranslations(locale, ['common', 'css', localeNamespace])),
        },
    };
};
