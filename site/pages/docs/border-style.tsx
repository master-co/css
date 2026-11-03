import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import BoxList from '~/components/Css/BoxList'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function BorderStyle() {

    return (
        <>
            <ClassTable names={[
                   ['border-style:`style`', 'border:`style`', 'b:`style`'],
                   ['border-style:`style`|`style`'],
                   ['border-style:`style`|`style`|`style`'],
                   ['border-style:`style`|`style`|`style`|`style`'],
                   ['border-top:`style`', 'bt:`style`'],
                   ['border-bottom:`style`', 'bb:`style`'],
                   ['border-left:`style`', 'bl:`style`'],
                   ['border-right:`style`', 'br:`style`'],
                   ['bx:`style`'],
                   ['by:`style`'],
                   ['b:none'],
                   ['b:hidden'],
                   ['b:dotted'],
                   ['b:dashed'],
                   ['b:solid'],
                   ['b:double'],
                   ['b:groove'],
                   ['b:ridge'],
                   ['b:inset'],
                   ['b:outset']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>border-style</code></strong>&nbsp;<a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property 
                sets the line style for all sides of an element&rsquo;s border.
            </p>
            <BoxList
                showClasses={[
                    'b:none',
                    'b:hidden',
                    'b:dotted',
                    'b:dashed',
                    'b:solid',
                    'b:double',
                    'b:groove',
                    'b:ridge',
                    'b:inset',
                    'b:outset'
                ]}
                renderClasses="b:5|blue-60">
            </BoxList>
          
            <StyleFunctions name="border-style:$(style)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="border-style:solid:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="border-style:solid@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="border-style:solid@print"></StyleMediaQueries>
            <StyleColorSchemes name="border-style:solid@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.border-style'

BorderStyle.page = {
    layout: CssDoc,
    title: 'Border Style',
    description: 'The border-style CSS property sets the line style for all sides of an element’s border.',
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

