import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function GridRows() {

    return (
        <>
            <ClassTable names={[
                ['grid-rows:`value`']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>grid-template-rows</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property 
                defines the line names and track sizing functions of the&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Glossary/Grid_Rows" target="blank">grid rows</a>. 
            </p>
            <StyleEditor
                tag="div"
                className="grid-rows:1"
                names={[
                    'grid-rows:1',
                    'grid-rows:2',
                    'grid-rows:4',
                    'grid-rows:6',
                    'grid-rows:12',
                ]}
                renderHtml={(className: string) => `
                <div class="**${className}** w:full ..gap:10..">
                    <div class="..box..">1</div>
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
            <StyleFunctions name="grid-rows:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="grid-rows:12:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="grid-rows:12@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="grid-rows:12@print"></StyleMediaQueries>
            <StyleColorSchemes name="grid-rows:12@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.grid-rows'

GridRows.page = {
    layout: CssDoc,
    title: 'Grid Rows',
    description: 'The grid-template-rows CSS property defines the line names and track sizing functions of the grid rows.',
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

