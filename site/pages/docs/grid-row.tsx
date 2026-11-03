import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function GridRow() {

    return (
        <>
            <ClassTable names={[
                ['grid-row:`value`'],
                ['grid-row-span:`value`'],
                ['grid-row-start:`value`'],
                ['grid-row-end:`value`'],

            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>grid-row</code></strong>&nbsp;<a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/Shorthand_properties" target="blank">shorthand property</a> specifies a grid item’s
                size and location within the grid row by contributing a line, a span, or nothing (automatic) to its grid placement,
                thereby specifying the
                inline-start and inline-end edge of its <a href="https://developer.mozilla.org/en-US/docs/Glossary/Grid_Areas" target="blank">grid area</a>.
            </p>
            <StyleEditor
                tag="div"
                className="grid-row-span:2"
                names={[
                    'grid-row-span:2',
                    'grid-row-span:3',
                    'grid-row-span:4',
                    'grid-row-start:2',
                    'grid-row-start:3',
                    'grid-row-start:-1',
                    'grid-row-start:span|2',
                    'grid-row-start:span|3',
                    'grid-row-end:2',
                    'grid-row-end:3',
                    'grid-row-end:-1',
                    'grid-row-end:span|2',
                    'grid-row-end:span|3'
                ]}
                renderHtml={(className: string) => `
                <div class="grid-rows:3 ..gap:10 stripe-bg..">
                    <div class="**${className}** ..box focus..">1</div>
                    <div class="..box..">2</div>
                    <div class="..box..">3</div>
                    <div class="..box..">4</div>
                    <div class="..box..">5</div>
                    <div class="..box..">6</div>
                    <div class="..box..">7</div>
                    <div class="..box..">8</div>
                    <div class="..box..">9</div>
                    <div class="..box..">10</div>
                    <div class="..box..">11</div>
                    <div class="..box..">12</div>
                    <div class="..box..">13</div>
                    <div class="..box..">14</div>
                    <div class="..box..">15</div>
                    <div class="..box..">16</div>
                </div>
                `} />
            <h3 id="combines">Combines</h3>
            <StyleEditor
                tag="div"
                className="grid-row-start:2 grid-row-end:4"
                names={[
                    'grid-row-start:2 grid-row-end:4',
                    'grid-row-start:2 grid-row-end:5',
                    'grid-row-start:3 grid-row-end:5',
                    'grid-row-start:1 grid-row-end:-1'
                ]}
                renderHtml={(className: string) => `
                <div class="grid-rows:3 ..gap:10 stripe-bg..">
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
            <StyleFunctions name="grid-row:2:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="grid-row:2:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="grid-row:2@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="grid-row:2@print"></StyleMediaQueries>
            <StyleColorSchemes name="grid-row:2@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.grid-row'

GridRow.page = {
    layout: CssDoc,
    title: 'Grid Row',
    description: 'The grid-row CSS shorthand property specifies a grid item’s size and location within the grid row by contributing a line, a span, or nothing (automatic) to its grid placement, thereby specifying the inline-start and inline-end edge of its grid area.',
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

