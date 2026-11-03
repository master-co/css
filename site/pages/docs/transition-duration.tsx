import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function TransitionDuration() {

    return (
        <>
            <ClassTable names={[
                ['transition-duration:`milliSeconds`,`…`'],
                ['~duration:`milliSeconds`,`…`']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>transition-duration</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a>&nbsp;
                property sets the length of time a transition animation should take to complete. 
                By default, the value is <strong>0s</strong>, meaning that no animation will occur.
            </p>
            <StyleEditor
                className="~duration:0ms"
                names={[
                    '~duration:0ms',
                    '~duration:300ms',
                    '~duration:500ms'
                ]}
                renderHtml={(className: string) => `
                <div class="..stripe-bg flex align-items:center..">
                    <div class="
                        bg:blue-60/.2
                        {bg:red-60/.2;px:50}:hover 
                        ~padding|ease-in
                        **${className}**
                        ..p:12|15 block f:14 r:5..">${className}
                    </div>
                </div>
                `}
            >
            </StyleEditor>
            <StyleFunctions name="~duration:$(milliSeconds)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="~duration:300ms:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="~duration:300ms@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="~duration:300ms@print"></StyleMediaQueries>
            <StyleColorSchemes name="~duration:300ms@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.transition-duration'

TransitionDuration.page = {
    layout: CssDoc,
    title: 'Transition Duration',
    description: 'The transition-duration CSS  property sets the length of time a transition animation should take to complete. By default, the value is 0s, meaning that no animation will occur.',
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
