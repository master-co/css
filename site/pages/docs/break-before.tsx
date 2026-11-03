import Link from '~/components/Link'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

export default function BreakBefore() {

    return (
        <>
            <ClassTable names={[
                ['break-before:`value`'],
                ['break-before:auto'],
                ['break-before:avoid'],
                ['break-before:avoid-column'],
                ['break-before:avoid-page'],
                ['break-before:column'],
                ['break-before:left'],
                ['break-before:page'],
                ['break-before:recto'],
                ['break-before:revert'],
                ['break-before:right'],
                ['break-before:verso']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>break-before</code></strong>&nbsp;<a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property sets 
                how page, column, or region breaks should behave before a generated box. If there is no generated box, the property is ignored.
            </p>
            <StyleFunctions name="break-before:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="break-before:auto:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="break-before:auto@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="break-before:auto@print"></StyleMediaQueries>
            <StyleColorSchemes name="break-before:auto@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.break-before'

BreakBefore.page = {
    layout: CssDoc,
    title: 'Break Before',
    description: 'The break-before CSS property sets how page, column, or region breaks should behave before a generated box. If there is no generated box, the property is ignored.',
    editors: ['Lola'],
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
