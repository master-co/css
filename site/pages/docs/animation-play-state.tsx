import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function AnimationPlayState() {

    return (
        <>
            <ClassTable names={[
                ['animation-play-state:`state`,`…`', '@play-state:`state`,`…`'],
                ['@play-state:running'],
                ['@play-state:paused'],
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>animation-play-state</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a>&nbsp;
                property sets whether an animation is running or paused.
            </p>
            <StyleEditor
                className="@play-state:running"
                names={[
                    '@play-state:running',
                    '@play-state:paused',
                ]}
                renderHtml={(className: string) => `
                <div class="@name:demo:hover>div ..w:100! h:100! bg:blue-60/.2 rounded flex align-items:center..">
                    <div class="
                        rel 
                        @iteration-count:infinite 
                        @easing:linear 
                        @duration:.75s
                        **${className}** 
                        ..p:12|15 block f:14 w:100! h:100! rounded cursor:pointer b:5|solid|blue-60 bg:blue-60/.2..">
                    </div>
                </div>
                `}
            >
            </StyleEditor>
            <StyleFunctions name="@animation-play-state:$(state)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="@animation-play-state:running:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="@animation-play-state:running@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="@animation-play-state:running@print"></StyleMediaQueries>
            <StyleColorSchemes name="@animation-play-state:running@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.animation-play-state'

AnimationPlayState.page = {
    layout: CssDoc,
    title: 'Animation Play State',
    description: 'The animation-play-state CSS  property sets whether an animation is running or paused.',
    editors: ['Aron', 'Lola'],
    localeNamespace,
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

