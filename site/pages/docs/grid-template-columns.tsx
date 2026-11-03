import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function GridTemplateColumns() {

    return (
        <>
            <ClassTable names={[
                ['grid-template-columns:`value`', 'grid-template-cols:`value`'],
                ['grid-template-cols:none'],
                [ 'grid-auto-cols:min'],
                ['grid-auto-cols:max'],
                ['grid-auto-cols:repeat(`min`,`max`)'],
                ['grid-auto-cols:fit-content(`min`,`max`)'],
                ['grid-auto-cols:minmax(`min`,`max`)']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>grid-template-columns</code></strong>&nbsp;<a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a>&nbsp;
                property defines the line names and track sizing functions of the 
                inline-start and inline-end edge of its <a href="grid-columns" target="blank">grid-columns</a>.
            </p>
            <StyleEditor
                tag="div"
                className="grid-template-columns:none"
                names={[
                    'grid-template-columns:none',
                    'grid-template-columns:min',
                    'grid-template-columns:max',
                    'grid-template-columns:fit-content(100%)',
                    'grid-template-columns:fit-content(5%)',
                    'grid-template-columns:fit-content(10px)',
                    'grid-template-columns:minmax(120px,auto)',
                    'grid-template-columns:minmax(120px,400px)',
                ]}
                renderHtml={(className: string) => `
                    <div class="**${className}** d:grid grid-auto-flow:column w:600 ..gap:10 stripe-bg..">
                        <div class="..box min-w:0!..">1</div>
                        <div class="..box min-w:0!..">2</div>
                        <div class="..box min-w:0!..">3</div>
                    </div>
                `} />
            <h2 id="basic-usage">Basic usage</h2>
            <h3 id="multiple">Multiple</h3>
            <StyleEditor
                tag="div"
                className="grid-template-columns:repeat(2,70px)"
                names={[
                    'grid-template-columns:repeat(2,70px)',
                    'grid-template-columns:repeat(3,70px)',
                    'grid-template-columns:45px|1fr',
                    'grid-template-columns:45px|1fr|30px'
                ]}
                renderHtml={(className: string) => `
                    <div class="**${className}** d:grid grid-auto-flow:column w:600 ..gap:10 stripe-bg..">
                        <div class="..box min-w:0!..">1</div>
                        <div class="..box min-w:0!..">2</div>
                        <div class="..box min-w:0!..">3</div>
                    </div>
                `} />
            
            <StyleFunctions name="grid-template-columns:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="grid-template-columns:none:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="grid-template-columns:none@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="grid-template-columns:none@print"></StyleMediaQueries>
            <StyleColorSchemes name="grid-template-columns:none@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.grid-template-columns'

GridTemplateColumns.page = {
    layout: CssDoc,
    title: 'Grid Template Columns',
    description: 'The grid-template-columns CSS  property defines the line names and track sizing functions of the inline-start and inline-end edge of its grid-columns.',
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

