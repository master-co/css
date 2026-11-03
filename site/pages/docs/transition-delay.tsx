import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function TransitionDelay() {

    return (
        <>
            <ClassTable names={[
                ['transition-delay:`milliSeconds`,`…`'],
                ['~delay:`milliSeconds`,`…`']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>transition-delay</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a>&nbsp;
                property specifies the duration to wait before starting a property&rsquo;s&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Transitions/Using_CSS_transitions" target="blank">transition effect</a>
                when its value changes.
            </p>
            <StyleEditor
                className="~delay:0ms"
                names={[
                    '~delay:0ms',
                    '~delay:300ms',
                    '~delay:500ms'
                ]}
                renderHtml={(className: string) => `
                <div class="..stripe-bg flex align-items:center..">
                    <div class="
                        bg:blue-60/.2
                        {bg:red-60/.2;px:50}:hover 
                        ~padding|ease-in|300ms
                        **${className}** ..p:12|15 block f:14 r:5..">${className}
                    </div>
                </div>
                `}
            >
            </StyleEditor>

            <StyleFunctions name="~delay:$(milliSeconds)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="~delay:300ms:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="~delay:300ms@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="~delay:300ms@print"></StyleMediaQueries>
            <StyleColorSchemes name="~delay:300ms@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.transition-delay'

TransitionDelay.page = {
    layout: CssDoc,
    title: 'Transition Delay',
    description: 'The transition-delay CSS  property specifies the duration to wait before starting a property’s transition effectwhen its value changes.',
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
