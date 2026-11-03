import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'
import StyleScrollbarExtend from '~/components/Css/StyleScrollbarExtend'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

export default function ScrollPadding() {

    return (
        <>
            <ClassTable names={[
                  ['scroll-padding:`size`', 'scroll-p:`size`'],
                  ['scroll-padding:`size`|`size`|`size`|`size`', 'scroll-p:`size`|`size`|`size`|`size`'],
                  ['scroll-padding-top:`size`', 'scroll-pt:`size`'],
                  ['scroll-padding-bottom:`size`', 'scroll-pb:`size`'],
                  ['scroll-padding-left:`size`', 'scroll-pl:`size`'],
                  ['scroll-padding-right:`size`', 'scroll-pr:`size`'],
                  ['scroll-px:`size`'],
                  ['scroll-py:`size`'],
            ]}>
            </ClassTable>
            
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>scroll-padding</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property
                sets all of the scroll paddings of an element at once, assigning values much like the <a href="padding">padding</a> property does for margins of an element.
            </p>
            <StyleScrollbarExtend></StyleScrollbarExtend> 
            <StyleFunctions name="scroll-p:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="scroll-p:10:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="scroll-p:10@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="scroll-p:10@print"></StyleMediaQueries>
            <StyleColorSchemes name="scroll-p:10@dark"></StyleColorSchemes>

        </>
    )
}
const localeNamespace = 'docs.css.scroll-padding'

ScrollPadding.page = {
    layout: CssDoc,
    title: 'Scroll Padding',
    description: 'The scroll-padding CSS property sets all of the scroll paddings of an element at once, assigning values much like the padding property does for margins of an element.',
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