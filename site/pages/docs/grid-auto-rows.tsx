import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function GridAutoRows() {

    return (
        <>
            <ClassTable names={[
                ['grid-auto-rows:`value`'],
                ['grid-auto-rows:auto'],
                ['grid-auto-rows:min'],
                ['grid-auto-rows:max'],
                ['grid-auto-rows:minmax(`min`,`max`)']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>grid-auto-rows</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property
                specifies the size of an implicitly-created grid row &nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Glossary/Grid_Tracks" target="blank">track</a>&nbsp;
                or pattern of tracks.
            </p>
            <StyleEditor
                tag="div"
                className="grid-auto-rows:70"
                names={[
                    'grid-auto-rows:auto',
                    'grid-auto-rows:min',
                    'grid-auto-rows:max',
                    'grid-auto-rows:minmax(60px,auto)',
                    'grid-auto-rows:minmax(20%,80px)'
                ]}
                renderHtml={(className: string) => `
                <div class="**${ className }** grid-cols:2 ..gap:10 stripe-bg..">
                    <div class="f:14! ..box..">1</div>
                    <div class="f:18! ..box..">2</div>
                    <div class="f:22! ..box..">3</div>
                    <div class="f:26! ..box..">4</div>
                    <div class="f:30! ..box..">5</div>
                    <div class="f:34! ..box..">6</div>
                    <div class="f:38! ..box..">7</div>
                    <div class="f:42! ..box..">8</div>
                </div>
                `} />
            <StyleFunctions name="grid-auto-rows:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="grid-auto-rows:min:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="grid-auto-rows:min@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="grid-auto-rows:min@print"></StyleMediaQueries>
            <StyleColorSchemes name="grid-auto-rows:min@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.grid-auto-rows'

GridAutoRows.page = {
    layout: CssDoc,
    title: 'Grid Auto Rows',
    description: 'The grid-auto-rows CSS property specifies the size of an implicitly-created grid row  track  or pattern of tracks.',
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

