import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function GridTemplateRows() {

    return (
        <>
            <ClassTable names={[
                ['grid-template-rows:`value`'],
                ['grid-template-rows:none'],
                ['grid-template-rows:min'],
                ['grid-template-rows:max'],
                ['grid-template-rows:repeat(`min`,`max`)'],
                ['grid-template-rows:fit-content(`min`,`max`)'],
                ['grid-template-rows:minmax(`min`,`max`)']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>grid-template-rows</code></strong>&nbsp;<a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a>&nbsp;
                property defines the line names and track sizing functions of the
                inline-start and inline-end edge of its <a href="grid-rows" target="blank">grid-rows</a>.
            </p>
            <StyleEditor
                tag="div"
                className="grid-template-rows:repeat(2,50px)"
                names={[
                    'grid-template-rows:repeat(2,50px)',
                    'grid-template-rows:none',
                    'grid-template-rows:min',
                    'grid-template-rows:max',
                    'grid-template-rows:fit-content(100%)',
                    'grid-template-rows:fit-content(10%)',
                    'grid-template-rows:fit-content(30px)',
                    'grid-template-rows:minmax(60px,auto)',
                    'grid-template-rows:minmax(60px,100px)'
                ]}
                renderHtml={(className: string) => `
                    <div class="**${className}** d:grid h:200 ..gap:10 stripe-bg..">
                        <div class="..box min-h:0!..">1</div>
                        <div class="..box min-h:0!..">2</div>
                        <div class="..box min-h:0!..">3</div>
                    </div>
                `} />
            <h2 id="basic-usage">Basic usage</h2>
            <h3 id="multiple">Multiple</h3>
            <StyleEditor
                tag="div"
                className="grid-template-rows:repeat(2,70px)"
                names={[
                    'grid-template-rows:repeat(2,70px)',
                    'grid-template-rows:repeat(3,70px)',
                    'grid-template-rows:45px|1fr',
                    'grid-template-rows:45px|1fr|30px'
                ]}
                renderHtml={(className: string) => `
                    <div class="**${className}** d:grid h:200 ..gap:10 stripe-bg..">
                        <div class="..box min-h:0!..">1</div>
                        <div class="..box min-h:0!..">2</div>
                        <div class="..box min-h:0!..">3</div>
                    </div>
                `} />
            <StyleFunctions name="grid-template-rows:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="grid-template-rows:none:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="grid-template-rows:none@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="grid-template-rows:none@print"></StyleMediaQueries>
            <StyleColorSchemes name="grid-template-rows:none@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.grid-template-rows'

GridTemplateRows.page = {
    layout: CssDoc,
    title: 'Grid Template Rows',
    description: 'The grid-template-rows CSS  property defines the line names and track sizing functions of the inline-start and inline-end edge of its grid-rows.',
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
