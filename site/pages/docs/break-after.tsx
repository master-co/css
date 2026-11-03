import Link from '~/components/Link'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

export default function BreakAfter() {
    return (
        <>
            <ClassTable names={[
                ['break-after:`value`'],
                ['break-after:auto'],
                ['break-after:avoid'],
                ['break-after:avoid-column'],
                ['break-after:avoid-page'],
                ['break-after:column'],
                ['break-after:left'],
                ['break-after:page'],
                ['break-after:recto'],
                ['break-after:revert'],
                ['break-after:right'],
                ['break-after:verso']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>break-after</code></strong>&nbsp;<a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property sets 
                how page, column, or region breaks should behave after a generated box. If there is no generated box, the property is ignored.
            </p>
            <StyleFunctions name="break-after:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="break-after:auto:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="break-after:auto@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="break-after:auto@print"></StyleMediaQueries>
            <StyleColorSchemes name="break-after:auto@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.break-after'

BreakAfter.page = {
    layout: CssDoc,
    title: 'Break After',
    description: 'The break-after CSS property sets how page, column, or region breaks should behave after a generated box. If there is no generated box, the property is ignored.',
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
}
