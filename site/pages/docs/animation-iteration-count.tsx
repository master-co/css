import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function AnimationIterationCount() {

    return (
        <>
            <ClassTable names={[
                 ['animation-iteration-count:`value`|`…`', '@iteration-count:`value`|`…`'],
                 ['@iteration-count:infinite']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>animation-iteration-count</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a>&nbsp;
                property sets the number of times an animation sequence should be played before stopping.
                <br/>
                If multiple values are specified, each time the animation is played the next value in the list is used, 
                cycling back to the first value after the last one is used.
            </p>
            <StyleEditor
                className="@iteration-count:1"
                names={[
                    '@iteration-count:1',
                    '@iteration-count:1.5',
                    '@iteration-count:3',
                    '@iteration-count:infinite',

                ]}
                renderHtml={(className: string) => `
                <div class="@name:demo:hover>div ..w:100! h:100! bg:blue-60/.2 rounded flex align-items:center..">
                    <div class="
                        rel 
                        @easing:linear 
                        @duration:.75s
                        **${className}** 
                        ..p:12|15 block f:14 w:100! h:100! rounded cursor:pointer b:5|solid|blue-60 bg:blue-60/.2..">
                    </div>
                </div>
                `}
            >
            </StyleEditor>
            <StyleFunctions name="@animation-iteration-count:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="@animation-iteration-count:infinite:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="@animation-iteration-count:infinite@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="@animation-iteration-count:infinite@print"></StyleMediaQueries>
            <StyleColorSchemes name="@animation-iteration-count:infinite@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.animation-iteration-count'

AnimationIterationCount.page = {
    layout: CssDoc,
    title: 'Animation Iteration Count',
    description: 'The animation-iteration-count CSS  property sets the number of times an animation sequence should be played before stopping.',
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
