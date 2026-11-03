import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import ShorthandList from '~/components/Css/ShorthandList'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function TextStroke() {

    return (
        <>
            <ClassTable names={[
                ['text-stroke:`length`|`color`']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>text-stroke</code></strong>&nbsp;<a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a>property 
                specifies the width and color of strokes for text characters.
                <br/>
                <br/>
                It is a shorthand for:
            </p>
            <ShorthandList items={[
                'text-stroke-color',
                'text-stroke-width'
            ]}>
            </ShorthandList>
            <StyleFunctions name="text-stroke:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="text-stroke:1;blue:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="text-stroke:1;blue@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="text-stroke:1;blue@print"></StyleMediaQueries>
            <StyleColorSchemes name="text-stroke:1;blue@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.text-stroke'

TextStroke.page = {
    layout: CssDoc,
    title: 'Text Stroke',
    description: 'The text-stroke CSSproperty specifies the width and color of strokes for text characters.',
    editors: ['Aron','Lola'],
    localeNamespace,
    mdn: '-webkit-text-stroke',
    canIUse: true
};

export async function getStaticProps({ locale }: any) {
    return {
        props: {
            ...(await serverSideTranslations(locale, ['common', 'css', localeNamespace])),
        },
    };
};

