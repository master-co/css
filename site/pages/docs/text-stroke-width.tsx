import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function TextStrokeWidth() {

    return (
        <>
            <ClassTable names={[
                     ['text-stroke-width:`value`', 'text-stroke:`value`'],
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>text-stroke-width</code></strong>&nbsp;<a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property
                specifies the width of the stroke for text.
            </p>
            <StyleEditor
                tag="div"
                className="text-stroke:1"
                names={[
                    'text-stroke:1',
                    'text-stroke:2',
                    'text-stroke:3',
                    'text-stroke:0',
                ]}
                renderHtml={(className: string) => `
                    <p class="**${className}** text-stroke:blue-60 f:40">
                        Virual CSS
                    </p>
                `}
            />
            <StyleFunctions name="text-stroke-width:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="text-stroke-width:2:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="text-stroke-width:2@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="text-stroke-width:2@print"></StyleMediaQueries>
            <StyleColorSchemes name="text-stroke-width:2@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.text-stroke-width'

TextStrokeWidth.page = {
    layout: CssDoc,
    title: 'Text Stroke Width',
    description: 'The text-stroke-width CSS property specifies the width of the stroke for text.',
    editors: ['Aron','Lola'],
    localeNamespace,
    mdn: '-webkit-text-stroke-width',
    canIUse: true
};

export async function getStaticProps({ locale }: any) {
    return {
        props: {
            ...(await serverSideTranslations(locale, ['common', 'css', localeNamespace])),
        },
    };
};

