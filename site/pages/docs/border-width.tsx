import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import BoxList from '~/components/Css/BoxList'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function BorderWidth() {

    return (
        <>
            <ClassTable names={[
                ['border-width:`size`', 'border:`size`', 'b:`size`'],
                ['border-width:`size`|`size`'],
                ['border-width:`size`|`size`|`size`|`size`'],
                ['border-top:`size`', 'bt:`size`'],
                ['border-bottom:`size`', 'bb:`size`'],
                ['border-left:`size`', 'bl:`size`'],
                ['border-right:`size`', 'br:`size`'],
                ['bx:`size`'],
                ['by:`size`']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>border-width</code></strong>&nbsp;<a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property
                sets the width of an element&rsquo;s border.
            </p>
            <BoxList
                showClasses={[
                    'b:0',
                    'b:2',
                    'b:4',
                    'b:8'
                ]}
                renderClasses="b:solid|blue-60">
            </BoxList>

            <StyleFunctions name="border-width:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="border-width:10:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="border-width:10@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="border-width:10@print"></StyleMediaQueries>
            <StyleColorSchemes name="border-width:10@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.border-width'

BorderWidth.page = {
    layout: CssDoc,
    title: 'Border Width',
    description: 'The border-width CSS property sets the width of an element’s border.',
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

