import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import ShorthandList from '~/components/Css/ShorthandList'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function Grid() {

    return (
        <>
            <ClassTable names={[
                ['grid:`template`'],
                ['grid:`template-rows`/`auto-flow`|`auto-columns`'],
                ['grid:`auto-flow`|`auto-rows`/`template-columns`']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>grid</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/Shorthand_properties" target="blank">shorthand</a>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property
                is a shorthand property that sets all of the explicit and implicit grid properties in a single declaration.
                It is a shorthand for:
            </p>
            <ShorthandList items={[
                'grid-auto-columns',
                'grid-auto-flow',
                'grid-auto-rows',
                'grid-template-areas',
                'grid-template-columns',
                'grid-template-rows'
            ]}>
            </ShorthandList>
            <StyleFunctions name="grid:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="grid:none:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="grid:none@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="grid:none@print"></StyleMediaQueries>
            <StyleColorSchemes name="grid:none@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.grid'

Grid.page = {
    layout: CssDoc,
    title: 'Grid',
    description: 'The grid shorthand CSS property is a shorthand property that sets all of the explicit and implicit grid properties in a single declaration.',
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

