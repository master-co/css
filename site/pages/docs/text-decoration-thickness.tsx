import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function TextDecorationThickness() {

    return (
        <>
            <ClassTable names={[
               ['text-decoration-thickness:`size`', 'text-decoration:`size`']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>text-decoration-thickness</code></strong>&nbsp;<a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property
                sets the stroke thickness of the decoration line that is used on text in an element, such as a line-through, underline, or overline.
            </p>
            <StyleEditor
                tag="div"
                className="text-decoration-thickness:1"
                names={[
                    'text-decoration-thickness:1',
                    'text-decoration:5px',
                    'text-decoration:3rem',
                ]}
                renderHtml={(className: string) => `
                    <p class="t:underline **${className}** f:40 text-decoration:blue-60">
                        Virual CSS
                    </p>
                `}
            />
            <StyleFunctions name="text-decoration-thickness:$(size)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="text-decoration-thickness:1:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="text-decoration-thickness:1@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="text-decoration-thickness:1@print"></StyleMediaQueries>
            <StyleColorSchemes name="text-decoration-thickness:1@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.text-decoration-thickness'

TextDecorationThickness.page = {
    layout: CssDoc,
    title: 'Text Decoration Thickness',
    description: 'The text-decoration-thickness CSS property sets the stroke thickness of the decoration line that is used on text in an element, such as a line-through, underline, or overline.',
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

