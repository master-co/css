import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'
import StyleScrollbarExtend from '~/components/Css/StyleScrollbarExtend'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

export default function ScrollSnapStop() {

    return (
        <>
            <ClassTable names={[
                  ['scroll-snap-stop:`value`'],
                  ['scroll-snap-stop:always'],
                  ['scroll-snap-stop:normal']
            ]}>
            </ClassTable>
            
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>scroll-snap-stop</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property
                defines whether the scroll container is allowed to <strong>pas over</strong> possible snap positions.
            </p>
            <StyleScrollbarExtend></StyleScrollbarExtend> 
            <StyleFunctions name="scroll-snap-stop:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="scroll-snap-stop:always:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="scroll-snap-stop:always@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="scroll-snap-stop:always@print"></StyleMediaQueries>
            <StyleColorSchemes name="scroll-snap-stop:always@dark"></StyleColorSchemes>

        </>
    )
}
const localeNamespace = 'docs.css.scroll-snap-stop'

ScrollSnapStop.page = {
    layout: CssDoc,
    title: 'Scroll Snap Stop',
    description: 'The scroll-snap-stop CSS property defines whether the scroll container is allowed to pas over possible snap positions.',
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
}
