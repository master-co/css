import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import BoxList from '~/components/Css/BoxList'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function OutlineOffset() {

    return (
        <>
            <ClassTable names={[
                ['outline-offset:`offset`']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>outline-offset</code></strong>&nbsp;<a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property
                sets the amount of space between an outline and the edge or border of an element.
            </p>
            <BoxList
                showClasses={[
                    'outline-offset:0',
                    'outline-offset:2',
                    'outline-offset:4',
                    'outline-offset:8'
                ]}
                renderClasses="outline:solid|blue-60 mt:15">
            </BoxList>
            <StyleFunctions name="outline-offset:$(offset)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="outline-offset:2:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="outline-offset:2@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="outline-offset:2@print"></StyleMediaQueries>
            <StyleColorSchemes name="outline-offset:2@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.outline-offset'

OutlineOffset.page = {
    layout: CssDoc,
    title: 'Outline Offset',
    description: 'The outline-offset CSS property sets the amount of space between an outline and the edge or border of an element.',
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

