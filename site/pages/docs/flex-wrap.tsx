import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function FlexWrap() {

    return (
        <>
            <ClassTable names={[
                ['flex-wrap:`value`', 'flex:`value`'],
                ['flex:wrap'],
                ['flex:wrap-reverse'],
                ['flex:nowrap'],
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>flex-wrap</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property 
                sets whether flex items are forced onto one line or can wrap onto multiple lines. 
                If wrapping is allowed, it sets the direction that lines are stacked.
            </p>
            <StyleFunctions name="flex-wrap:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="flex-wrap:wrap:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="flex-wrap:wrap@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="flex-wrap:wrap@print"></StyleMediaQueries>
            <StyleColorSchemes name="flex-wrap:wrap@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.flex-wrap'

FlexWrap.page = {
    layout: CssDoc,
    title: 'Flex Wrap',
    description: 'The flex-wrap CSS property sets whether flex items are forced onto one line or can wrap onto multiple lines. If wrapping is allowed, it sets the direction that lines are stacked.',
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

