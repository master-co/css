import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'
import StyleScrollbarExtend from '~/components/Css/StyleScrollbarExtend'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

export default function ScrollSnapType() {

    return (
        <>
            <ClassTable names={[
                ['scroll-snap-type:`value`', 'scroll-snap:`value`'],
                ['scroll-snap-type:`value`|`value`', 'scroll-snap:`value`|value`'],
                ['scroll-snap:x'],
                ['scroll-snap:y'],
                ['scroll-snap:both'],
                ['scroll-snap:block'],
                ['scroll-snap:inline'],
                ['scroll-snap:x|mandatory'],
                ['scroll-snap:y|proximity'],
                ['scroll-snap:both|mandatory'],
                ['scroll-snap-type:none']
            ]}>
            </ClassTable>

            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>scroll-snap-type</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property
                sets how strictly snap points are enforced on the scroll container in case there is one.
            </p>
            <StyleScrollbarExtend></StyleScrollbarExtend>
            <StyleFunctions name="scroll-snap-type:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="scroll-snap-type:both:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="scroll-snap-type:both@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="scroll-snap-type:both@print"></StyleMediaQueries>
            <StyleColorSchemes name="scroll-snap-type:both@dark"></StyleColorSchemes>

        </>
    )
}

const localeNamespace = 'docs.css.scroll-snap-type'

ScrollSnapType.page = {
    layout: CssDoc,
    title: 'Scroll Snap Type',
    description: 'The scroll-snap-type CSS property sets how strictly snap points are enforced on the scroll container in case there is one.',
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
}
