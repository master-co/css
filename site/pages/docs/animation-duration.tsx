import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function AnimationDuration() {

    return (
        <>
            <ClassTable names={[
                ['animation-duration:`milliSeconds`,`…`','@duration:`milliSeconds`,`…`']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>animation-duration</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a>&nbsp;
                property sets the length of time that an animation takes to complete one cycle.
            </p>
            <StyleEditor
                className="@duration:1s"
                names={[
                    '@duration:1s',
                    '@duration:3s',
                    '@duration:.5s'
                ]}
                renderHtml={(className: string) => `
                <div class="@name:demo:hover>div ..w:100! h:100! bg:blue-60/.2 rounded flex align-items:center..">
                    <div class="
                        rel 
                        @iteration-count:infinite 
                        @easing:linear 
                        **${className}** 
                        ..p:12|15 block f:14 w:100! h:100! rounded cursor:pointer b:5|solid|blue-60 bg:blue-60/.2..">
                    </div>
                </div>
                `}
            >
            </StyleEditor>
            <StyleFunctions name="@duration:$(milliSeconds)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="@duration:1s:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="@duration:1s@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="@duration:1s@print"></StyleMediaQueries>
            <StyleColorSchemes name="@duration:1s@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.animation-duration'

AnimationDuration.page = {
    layout: CssDoc,
    title: 'Animation Duration',
    description: 'The animation-duration CSS  property sets the length of time that an animation takes to complete one cycle.',
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
