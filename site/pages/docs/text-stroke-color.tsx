import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function TextStrokeColor() {

    return (
        <>
            <ClassTable names={[
                     ['text-stroke-color:`color`', 'text-stroke:`color`'],
                     ['text-stroke:#`hex`'],
                     ['text-stroke:rgb(`rgb`)'],
                     ['text-stroke:hsl(`hsl`)']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>text-stroke-color</code></strong>&nbsp;<a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property
                specifies the stroke color of characters of text. 
                If this property is not set, the value of the color property is used.
            </p>
            <StyleEditor
                tag="div"
                className="text-stroke:blue-60"
                names={[
                    'text-stroke:blue-60',
                    'text-stroke:gray-57',
                    'text-stroke:red-60'
                ]}
                renderHtml={(className: string) => `
                    <p class="**${className}** text-stroke:1 f:40">
                        Virual CSS
                    </p>
                `}
            />
            <StyleFunctions name="text-stroke:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="text-stroke:blue-20:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="text-stroke:blue-20@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="text-stroke:blue-20@print"></StyleMediaQueries>
            <StyleColorSchemes name="text-stroke:blue-20@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.text-stroke-color'

TextStrokeColor.page = {
    layout: CssDoc,
    title: 'Text Stroke Color',
    description: 'The text-stroke-color CSS property specifies the stroke color of characters of text. If this property is not set, the value of the color property is used.',
    editors: ['Aron','Lola'],
    localeNamespace,
    mdn: '-webkit-text-stroke-color',
    canIUse: true
};

export async function getStaticProps({ locale }: any) {
    return {
        props: {
            ...(await serverSideTranslations(locale, ['common', 'css', localeNamespace])),
        },
    };
};
