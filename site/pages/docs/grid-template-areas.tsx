import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function GridTemplateAreas() {

    return (
        <>
            <ClassTable names={[
                ['grid-template-areas:`value`'],
                ['grid-template-areas:none'],
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>grid-template-areas</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property&nbsp;
                specifies named <strong>grid areas</strong>, establishing the cells in the grid and assigning them names.
            </p>
            <StyleFunctions name="grid-template-areas:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="grid-template-areas:none:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="grid-template-areas:none@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="grid-template-areas:none@print"></StyleMediaQueries>
            <StyleColorSchemes name="grid-template-areas:none@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.grid-template-areas'

GridTemplateAreas.page = {
    layout: CssDoc,
    title: 'Grid Template Areas',
    description: 'The grid-template-areas CSS property  specifies named grid areas, establishing the cells in the grid and assigning them names.',
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

