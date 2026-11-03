import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function WritingMode() {
    return (
        <>
            <ClassTable names={[
                ['writing-mode:`mode`'],
                ['writing-mode:horizontal-tb'],
                ['writing-mode:vertical-rl'],
                ['writing-mode:vertical-lr'],
                ['writing-mode:lr'],
                ['writing-mode:lr-tb'],
                ['writing-mode:rl'],
                ['writing-mode:rl-tb'],
                ['writing-mode:tb'],
                ['writing-mode:tb-rl']
            ]}>
            </ClassTable>

            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>writing-mode</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property 
                sets whether lines of text are laid out horizontally or vertically, 
                as well as the direction in which blocks progress. 
                When set for an entire document, it should be set on the root element (html element for HTML documents).
            </p>
            <StyleEditor
                tag="p"
                className="writing-mode:horizontal-tb"
                names={[
                    'writing-mode:horizontal-tb',
                    'writing-mode:vertical-lr',
                    'writing-mode:vertical-rl'
                ]}
                renderHtml={(className: string) => `
                <div class="**${className}**">
                    <p class="f:blue-60! ..p:5 grid-col-span:2 m:auto..">
                        Writing Mode
                    </p>
                    <p class="..p:5 grid-col-span:2 m:auto..">
                        Virtual CSS
                    </p>
                </div>
                `} />
            <StyleFunctions name="writing-mode:$(mode)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="writing-mode:horizontal-tb:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="writing-mode:horizontal-tb@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="writing-mode:horizontal-tb@print"></StyleMediaQueries>
            <StyleColorSchemes name="writing-mode:horizontal-tb@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.writing-mode'

WritingMode.page = {
    layout: CssDoc,
    title: 'Writing Mode',
    description: 'The writing-mode CSS property sets whether lines of text are laid out horizontally or vertically, as well as the direction in which blocks progress. When set for an entire document, it should be set on the root element (html element for HTML documents).',
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
