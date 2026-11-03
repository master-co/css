import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function LineClamp() {
    return (
        <>
            <ClassTable names={[
                ['lines:`value`']
            ]}>
            </ClassTable>

            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>line-clamp</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property 
                allows limiting of the contents of a block container to the specified number of lines.
            </p>
            <StyleEditor
                tag="p"
                className="lines:1"
                names={[
                    'lines:1',
                    'lines:2',
                    'lines:3',
                    'lines:4'
                ]}
                hideHtml="true"
                renderHtml={(className: string) => `
                    <p class="**${className}** ..p:5 grid-col-span:2 word-spacing:4 m:auto..">
                        Ladies and gentlemen, the first Virtual CSS came to the world.It will crush all CSS and UI libraries,
                        and subvert your understanding of traditional CSS technology. Keep up with the latest technological trends,
                        he will greatly improve Web interaction and execution efficiency.
                    </p>
                `} />
            <StyleFunctions name="ls:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="ls:1:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="ls:1@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="ls:1@print"></StyleMediaQueries>
            <StyleColorSchemes name="ls:1@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.line-clamp'

LineClamp.page = {
    layout: CssDoc,
    title: 'Line Clamp',
    description: 'The line-clamp CSS property allows limiting of the contents of a block container to the specified number of lines.',
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
