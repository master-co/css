import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'
import StyleScrollbarExtend from '~/components/Css/StyleScrollbarExtend'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

export default function ScrollMargin() {

    return (
        <>
            <ClassTable names={[
                  ['scroll-margin:`size`', 'scroll-m:`size`'],
                  ['scroll-margin:`size`|`size`|`size`|`size`', 'scroll-m:`size`|`size`|`size`|`size`'],
                  ['scroll-margin-top:`size`', 'scroll-mt:`size`'],
                  ['scroll-margin-bottom:`size`', 'scroll-mb:`size`'],
                  ['scroll-margin-left:`size`', 'scroll-ml:`size`'],
                  ['scroll-margin-right:`size`', 'scroll-mr:`size`'],
                  ['scroll-mx:`size`'],
                  ['scroll-my:`size`'],
            ]}>
            </ClassTable>
            
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>scroll-margin</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property
                sets all of the scroll margins of an element at once, assigning values much like the <a href="marign">margin</a> property does for margins of an element.
            </p>
            <StyleScrollbarExtend></StyleScrollbarExtend> 
            <StyleFunctions name="scroll-m:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="scroll-m:10:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="scroll-m:10@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="scroll-m:10@print"></StyleMediaQueries>
            <StyleColorSchemes name="scroll-m:10@dark"></StyleColorSchemes>

        </>
    )
}
const localeNamespace = 'docs.css.scroll-margin'

ScrollMargin.page = {
    layout: CssDoc,
    title: 'Scroll Margin',
    description: 'The scroll-margin CSS property sets all of the scroll margins of an element at once, assigning values much like the margin property does for margins of an element.',
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