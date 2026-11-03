import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function GridAutoColumns() {

    return (
        <>
            <ClassTable names={[
                ['grid-auto-columns:`value`','grid-auto-cols:`value`'],
                ['grid-auto-cols:auto'],
                ['grid-auto-cols:min'],
                ['grid-auto-cols:max'],
                ['grid-auto-cols:minmax(`min`,`max`)']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>grid-auto-columns</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property
                specifies the size of an implicitly-created grid column&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Glossary/Grid_Tracks" target="blank">track</a>&nbsp;
                or pattern of tracks.
            </p>
            <StyleEditor
                tag="div"
                className="grid-auto-cols:auto"
                names={[
                    'grid-auto-cols:auto',
                    'grid-auto-cols:min',
                    'grid-auto-cols:max',
                    'grid-auto-cols:auto',
                    'grid-auto-cols:minmax(20%,80px)'
                ]}
                renderHtml={(className: string) => `
                <div class="grid-rows:2 **${className}** ..gap:10 stripe-bg w:500..">
                    <div class="..box..">One</div>
                    <div class="..box..">Two</div>
                    <div class="..box..">Three</div>
                    <div class="..box..">Five</div>
                    <div class="..box..">Six</div>
                    <div class="..box..">Seven</div>
                    <div class="..box..">Eight</div>
                </div>
                `} />
            <StyleFunctions name="grid-auto-columns:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="grid-auto-columns:auto:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="grid-auto-columns:auto@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="grid-auto-columns:auto@print"></StyleMediaQueries>
            <StyleColorSchemes name="grid-auto-columns:auto@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.grid-auto-columns'

GridAutoColumns.page = {
    layout: CssDoc,
    title: 'Grid Auto Columns',
    description: 'The grid-auto-columns CSS property specifies the size of an implicitly-created grid column track  or pattern of tracks.',
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

