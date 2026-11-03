import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'
import StyleScrollbarExtend from '~/components/Css/StyleScrollbarExtend'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

export default function ScrollSnapAlign() {

    return (
        <>
            <ClassTable names={[
                  ['scroll-snap-align:`value`','scroll-snap:`value`'],
                  ['scroll-snap-align:`value`|`value`','scroll-snap:`value`|`value`'],
                  ['scroll-snap:center'],
                  ['scroll-snap:end'],
                  ['scroll-snap:start'],
                  ['scroll-snap-align:none']
            ]}>
            </ClassTable>
            
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>scroll-snap-align</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property
                specifies the box’s snap position as an alignment of its snap area (as the alignment subject) within its snap container’s snapport (as the alignment container). The two values specify the snapping alignment in the block axis and inline axis, respectively. If only one value is specified, the second value defaults to the same value.
            </p>
            <StyleScrollbarExtend></StyleScrollbarExtend> 
            <StyleFunctions name="scroll-snap-align:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="scroll-snap-align:center:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="scroll-snap-align:center@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="scroll-snap-align:center@print"></StyleMediaQueries>
            <StyleColorSchemes name="scroll-snap-align:center@dark"></StyleColorSchemes>

        </>
    )
}
const localeNamespace = 'docs.css.scroll-snap-align'

ScrollSnapAlign.page = {
    layout: CssDoc,
    title: 'Scroll Snap Align',
    description: 'The scroll-snap-align CSS property specifies the box’s snap position as an alignment of its snap area (as the alignment subject) within its snap container’s snapport (as the alignment container). The two values specify the snapping alignment in the block axis and inline axis, respectively. If only one value is specified, the second value defaults to the same value.',
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