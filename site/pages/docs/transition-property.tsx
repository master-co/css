import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function TransitionProperty() {

    return (
        <>
            <ClassTable names={[
                ['transition-property:`value`,`…`'],
                ['~property:`value`,`…`']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>transition-property</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a>&nbsp;
                property sets the CSS properties to which a&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Transitions/Using_CSS_transitions">transition effect</a> should be applied.
            </p>
            <StyleEditor
                className="~property:all"
                names={[
                    '~property:all',
                    '~property:background-color',
                    '~property:padding'
                ]}
                renderHtml={(className: string) => `
                <div class="..stripe-bg flex align-items:center..">
                    <div class="
                        bg:blue-60/.2
                        {bg:red-60/.2;px:50}:hover 
                        ~ease-in|300ms
                        **${className}**
                        ..p:12|15 block f:14 r:5..">${className}
                    </div>
                </div>
                `}
            >
            </StyleEditor>
            <StyleFunctions name="~property:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="~property:all:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="~property:all@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="~property:all@print"></StyleMediaQueries>
            <StyleColorSchemes name="~property:all@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.transition-property'

TransitionProperty.page = {
    layout: CssDoc,
    title: 'Transition Property',
    description: 'The transition-property CSS  property sets the CSS properties to which a transition effect should be applied.',
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
