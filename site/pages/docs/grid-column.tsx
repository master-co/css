import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function GridColumn() {

    return (
        <>
            <ClassTable names={[
                ['grid-column:`value`','grid-col:`value`'],
                ['grid-col-span:`value`'],
                ['grid-col-start:`value`'],
                ['grid-col-end:`value`'],
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>grid-column</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/Shorthand_properties" target="blank">shorthand property</a>&nbsp;
                specifies a grid item&rsquo;s size and location within a&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Glossary/Grid_Column" target="blank">grid column</a>&nbsp;
                by contributing a line, a span, or nothing (automatic) to its grid placement, thereby specifying the inline-start and inline-end edge of its&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Glossary/Grid_Areas" target="blank">grid area</a>
                .
            </p>
            <StyleEditor
                tag="div"
                className="grid-col-span:2"
                names={[
                    'grid-col-span:2',
                    'grid-col-span:3',
                    'grid-col-span:4',
                    'grid-col-start:2',
                    'grid-col-start:3',
                    'grid-col-start:-1',
                    'grid-col-start:span|2',
                    'grid-col-start:span|3',
                    'grid-col-end:2',
                    'grid-col-end:3',
                    'grid-col-end:-1',
                    'grid-col-end:span|2',
                    'grid-col-end:span|3'
                ]}
                renderHtml={(className: string) => `
                <div class="grid-cols:3 ..gap:10 stripe-bg..">
                    <div class="**${className}** ..box focus..">1</div>
                    <div class="..box..">2</div>
                    <div class="..box..">3</div>
                    <div class="..box..">4</div>
                    <div class="..box..">5</div>
                    <div class="..box..">6</div>
                    <div class="..box..">7</div>
                    <div class="..box..">8</div>
                </div>
                `} />
            <h3 id="combines">Combines</h3>
            <StyleEditor
                tag="div"
                className="grid-col-start:2 grid-col-end:4"
                names={[
                    'grid-col-start:2 grid-col-end:4',
                    'grid-col-start:2 grid-col-end:5',
                    'grid-col-start:3 grid-col-end:5',
                    'grid-col-start:1 grid-col-end:-1'
                ]}
                renderHtml={(className: string) => `
                <div class="grid-cols:3 ..gap:10 stripe-bg..">
                    <div class="**${className}** ..box focus..">1</div>
                    <div class="..box..">2</div>
                    <div class="..box..">3</div>
                    <div class="..box..">4</div>
                    <div class="..box..">5</div>
                    <div class="..box..">6</div>
                    <div class="..box..">7</div>
                    <div class="..box..">8</div>
                </div>
                `} />
            <StyleFunctions name="grid-column:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="grid-column:1:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="grid-column:1@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="grid-column:1@print"></StyleMediaQueries>
            <StyleColorSchemes name="grid-column:1@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.grid-column'

GridColumn.page = {
    layout: CssDoc,
    title: 'Grid Column',
    description: 'The grid-column CSS shorthand property  specifies a grid item’s size and location within a grid column  by contributing a line, a span, or nothing (automatic) to its grid placement, thereby specifying the inline-start and inline-end edge of its grid area.',
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
