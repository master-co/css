import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function AnimationFillMode() {

    return (
        <>
            <ClassTable names={[
                ['animation-fill-mode:`mode`,`…`', '@fill-mode:`mode`,`…`'],
                ['@fill-mode:none'],
                ['@fill-mode:forwards'],
                ['@fill-mode:backwards'],
                ['@fill-mode:both']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>animation-fill-mode</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a>&nbsp;
                property sets how a CSS animation applies styles to its target before and after its execution.
            </p>
            <StyleEditor
                className="@fill-mode:none"
                names={[
                    '@fill-mode:none',
                    '@fill-mode:forwards',
                    '@fill-mode:backwards',
                    '@fill-mode:both',
                ]}
                renderHtml={(className: string) => `
                <div class="@name:demo:hover>div ..w:100! h:100! bg:blue-60/.2 rounded flex align-items:center..">
                    <div class="
                        rel 
                        @duration:.75s
                        **${className}** 
                        ..p:12|15 block f:14 w:100! h:100! rounded cursor:pointer b:5|solid|blue-60 bg:blue-60/.2..">
                    </div>
                </div>
                `}
            >
            </StyleEditor>
            <StyleFunctions name="@fill-mode:$(mode)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="@fill-mode:none:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="@fill-mode:none@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="@fill-mode:none@print"></StyleMediaQueries>
            <StyleColorSchemes name="@fill-mode:none@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.animation-fill-mode'

AnimationFillMode.page = {
    layout: CssDoc,
    title: 'Animation Fill Mode',
    description: 'The animation-fill-mode CSS  property sets how a CSS animation applies styles to its target before and after its execution.',
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

