import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function TextDecorationColor() {

    return (
        <>
            <ClassTable names={[
               ['text-decoration-color:`color`', 'text-decoration:`color`'],
               ['text-decoration:#`hex`'],
               ['text-decoration:rgb(`rgb`)'],
               ['text-decoration:hsl(`hsl`)'],
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>text-decoration-color</code></strong>&nbsp;<a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property
                sets the color of decorations added to text by&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/text-decoration-line" target="blank">text-decoration-line</a>.
            </p>
            <StyleEditor
                tag="div"
                className="text-decoration:blue-60"
                names={[
                    'text-decoration:blue-60',
                    'text-decoration:gray-50',
                    'text-decoration:red-60'
                ]}
                renderHtml={(className: string) => `
                    <p class="t:underline **${className}** f:40">
                        Virual CSS
                    </p>
                `}
            />
            <StyleFunctions name="text-decoration-color:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="text-decoration-color:gray-10:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="text-decoration-color:gray-10@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="text-decoration-color:gray-10@print"></StyleMediaQueries>
            <StyleColorSchemes name="text-decoration-color:gray-10@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.text-decoration-color'

TextDecorationColor.page = {
    layout: CssDoc,
    title: 'Text Decoration Color',
    description: 'The text-decoration-color CSS property sets the color of decorations added to text by text-decoration-line.',
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

