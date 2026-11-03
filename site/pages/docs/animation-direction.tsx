import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function AnimationDirection() {

    return (
        <>
            <ClassTable names={[
                ['animation-direction:`value`,`…`', '@direction:`value`,`…`'],
                ['@direction:normal'],
                ['@direction:reverse'],
                ['@direction:alternate'],
                ['@direction:alternate-reverse'],
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>animation-direction</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a>&nbsp;
                property sets whether an animation should play forward, backward, or alternate back and forth between playing the sequence forward and backward.
            </p>
            <StyleEditor
                className="@direction:normal"
                names={[
                    '@direction:normal',
                    '@direction:reverse',
                    '@direction:alternate',
                    '@direction:alternate-reverse'
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
            <StyleFunctions name="@direction:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="@direction:normal:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="@direction:normal@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="@direction:normal@print"></StyleMediaQueries>
            <StyleColorSchemes name="@direction:normal@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.animation-direction'

AnimationDirection.page = {
    layout: CssDoc,
    title: 'Animation Direction',
    description: 'The animation-direction CSS  property sets whether an animation should play forward, backward, or alternate back and forth between playing the sequence forward and backward.',
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

