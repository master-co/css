import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import BoxList from '~/components/Css/BoxList'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function AnimationDelay() {

    return (
        <>
            <ClassTable names={[
                ['animation-delay:`milliSeconds`,`…`'],
                ['@delay:`milliSeconds`,`…`']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>animation-delay</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a>&nbsp;
                property specifies the amount of time to wait from applying the animation to an element before beginning to perform the animation. 
                The animation can start later, immediately from its beginning, or immediately and partway through the animation.
            </p>
            <BoxList
                showClasses={[
                    '@delay:0ms',
                    '@delay:300ms',
                    '@delay:500ms',
                    '@delay:-500ms'
                ]}
                renderClasses="
                    p:10 my:15 block f:14 w:100! h:100! rounded cursor:pointer 
                    b:5|solid|blue-60 bg:blue-60/.2
                    @name:demo:hover 
                    @duration:1s">
            </BoxList>
            <StyleFunctions name="@delay:$(milliSeconds)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="@delay:300ms:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="@delay:300ms@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="@delay:300ms@print"></StyleMediaQueries>
            <StyleColorSchemes name="@delay:300ms@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.animation-delay'

AnimationDelay.page = {
    layout: CssDoc,
    title: 'Animation Delay',
    description: 'The animation-delay CSS  property specifies the amount of time to wait from applying the animation to an element before beginning to perform the animation. The animation can start later, immediately from its beginning, or immediately and partway through the animation.',
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
