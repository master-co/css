import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function LineHeight() {
    return (
        <>
            <ClassTable names={[
                ['line-height:`size`','lh:`size`']
            ]}>
            </ClassTable>

            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>line-height</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property 
                sets the height of a line box. It&#39;s commonly used to set the distance between lines of text. 
                On block-level elements, it specifies the minimum height of line boxes within the element. 
                On non-replaced inline elements, it specifies the height that is used to calculate line box height.
            </p>
            <StyleEditor
                tag="p"
                className="lh:1.2"
                names={[
                    'lh:1.2',
                    'lh:1.5',
                    'lh:2'
                ]}
                hideHtml="true"
                renderHtml={(className: string) => `
                    <p class="**${className}** ..p:5 grid-col-span:2 word-spacing:4 m:auto..">
                        Ladies and gentlemen, the first Virtual CSS came to the world.It will crush all CSS and UI libraries,
                        and subvert your understanding of traditional CSS technology. Keep up with the latest technological trends,
                        he will greatly improve Web interaction and execution efficiency.
                    </p>
                `} />
            <StyleFunctions name="lh:$(size)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="lh:1:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="lh:1@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="lh:1@print"></StyleMediaQueries>
            <StyleColorSchemes name="lh:1@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.line-height'

LineHeight.page = {
    layout: CssDoc,
    title: 'Line Height',
    description: 'The line-height CSS property sets the height of a line box. It\'s commonly used to set the distance between lines of text. On block-level elements, it specifies the minimum height of line boxes within the element. On non-replaced inline elements, it specifies the height that is used to calculate line box height.',
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