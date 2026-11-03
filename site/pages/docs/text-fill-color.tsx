import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function TextFillColor() {

    return (
        <>
            <ClassTable names={[
               ['text-fill-color:`color`', 'text-fill:`color`'],
               ['text-fill:#`hex`'],
               ['text-fill:rgb(`rgb`)'],
               ['text-fill:hsl(`hsl`)']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>text-fill-color</code></strong>&nbsp;<a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property
                specifies the fill color of characters of text.
                <br/>
                The <code>text-fill-color</code> will take precedence over  <a href="font-color">color</a>, if this property is not set, the value of the color property is used.
            </p>
            <StyleEditor
                tag="div"
                className="text-fill:blue-60"
                names={[
                    'text-fill:blue-60',
                    'text-fill:cyan-50',
                    'text-fill:red-60'
                ]}
                renderHtml={(className: string) => `
                    <p class="f:40 f:fade-50 f:dray-50@dark">
                        Virual <span class="**${className}**">CSS</span>
                    </p>
                `}
            />
            <StyleFunctions name="text-fill-color:$(size)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="text-fill-color:blue:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="text-fill-color:blue@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="text-fill-color:blue@print"></StyleMediaQueries>
            <StyleColorSchemes name="text-fill-color:blue@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.text-fill-color'

TextFillColor.page = {
    layout: CssDoc,
    title: 'Text Fill Color',
    description: 'The text-fill-color CSS property specifies the fill color of characters of text. The text-fill-color will take precedence over color, if this property is not set, the value of the color property is used.',
    editors: ['Aron','Lola'],
    localeNamespace
,
    mdn: '-webkit-text-fill-color',
    canIUse: true
};

export async function getStaticProps({ locale }: any) {
    return {
        props: {
            ...(await serverSideTranslations(locale, ['common', 'css', localeNamespace])),
        },
    };
};
