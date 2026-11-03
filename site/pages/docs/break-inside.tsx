import Link from '~/components/Link'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

export default function BreakInside() {

    return (
        <>
            <ClassTable names={[
                ['break-inside:`value`'],
                ['break-inside:auto'],
                ['break-inside:avoid'],
                ['break-inside:avoid-column'],
                ['break-inside:avoid-page'],
                ['break-inside:revert']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>break-inside</code></strong>&nbsp;<a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property sets 
                how page, column, or region breaks should behave inside a generated box. If there is no generated box, the property is ignored.
            </p>
            <StyleFunctions name="break-inside:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="break-inside:auto:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="break-inside:auto@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="break-inside:auto@print"></StyleMediaQueries>
            <StyleColorSchemes name="break-inside:auto@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.break-inside'

BreakInside.page = {
    layout: CssDoc,
    title: 'Break Inside',
    description: 'The break-inside CSS property sets how page, column, or region breaks should behave inside a generated box. If there is no generated box, the property is ignored.',
    editors: ['Aron'],
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
