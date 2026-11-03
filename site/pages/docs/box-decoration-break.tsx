import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function BoxDecorationBreak() {

    return (
        <>
            <ClassTable names={[
                ['box-decoration-break:`type`', 'box:`type`'],
                ['box:slice'],
                ['box:clone'],
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>box-decoration-break</code></strong>&nbsp;<a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property specifies
                how an element&rsquo;s <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Fragmentation">fragments</a> should be rendered when broken across multiple lines, columns, or pages.
            </p>
            <StyleEditor
                autofocus
                tag="div"
                className="box:clone"
                names={[
                    'box:clone',
                    'box:slice'
                ]}
                renderHtml={(className: string) => `
                    <div class="max-w:100 margin:8|auto">
                        <span class="**${className}** bg:linear-gradient(to|right,#eeaeca,#94bbe9) f:white r:8 p:4|8 lh:1.8 f:28">Virtual CSS</span>
                    </div>
                `} />
            <StyleFunctions name="box-decoration-break:$(type)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="box:slice:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="box:slice@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="box:slice@print"></StyleMediaQueries>
            <StyleColorSchemes name="box:slice@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.box-decoration-break'

BoxDecorationBreak.page = {
    layout: CssDoc,
    title: 'Box Decoration Break',
    description: 'The box-decoration-break CSS property specifies how an element’s fragments should be rendered when broken across multiple lines, columns, or pages.',
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
}
