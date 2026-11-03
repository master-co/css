import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'
import StyleScrollbarExtend from '~/components/Css/StyleScrollbarExtend'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

export default function WillChange() {

    return (
        <>
            <ClassTable names={[
                 ['will-change:`value`']
            ]}>
            </ClassTable>
            
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>will-change</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property
                property hints to browsers how an element is expected to change. 
                Browsers may set up optimizations before an element is actually changed. 
                These kinds of optimizations can increase the responsiveness of a page by doing potentially expensive work before they are actually required.
            </p>
            <StyleFunctions name="will-change:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="will-change:auto:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="will-change:auto@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="will-change:auto@print"></StyleMediaQueries>
            <StyleColorSchemes name="will-change:auto@dark"></StyleColorSchemes>

        </>
    )
}

const localeNamespace = 'docs.css.will-change'

WillChange.page = {
    layout: CssDoc,
    title: 'Will Change',
    description: 'The will-change CSS property property hints to browsers how an element is expected to change. Browsers may set up optimizations before an element is actually changed. These kinds of optimizations can increase the responsiveness of a page by doing potentially expensive work before they are actually required.',
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
