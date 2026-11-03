import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import Code from '~/components/Code'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import Demo from '~/components/Demo'
import CssDoc from '~/layouts/CssDoc'

export default function GridColumns() {

    return (
        <>
            <ClassTable names={[
                ['grid-columns:`value`', 'grid-cols:`value`']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>grid-template-columns</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property
                defines the line names and track sizing functions of the&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Glossary/Grid_Column" target="blank">grid columns</a>.
            </p>
            <StyleEditor
                tag="div"
                className="grid-cols:6"
                hideHtml
                names={[
                    'grid-cols:3',
                    'grid-cols:6',
                    'grid-cols:12',
                    'grid-cols:24',
                    'grid-cols:36',
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
            <h2 id="basic-usage">Basic usage</h2>
            <h3 id="add-a-grid-with-gap">Add a grid with gap</h3>
            {(() => {
                const code = `
                    <div class="**grid-cols:3** **gap:10** w:full">
                        <div class="box">1</div>
                        <div class="box">2</div>
                        <div class="box">3</div>
                        <div class="box">4</div>
                        <div class="box">5</div>
                        <div class="box">6</div>
                    </div>
                `
                return (
                    <>
                        <Demo html={code}></Demo>
                        <Code lang="html">{code}</Code>
                    </>
                )
            })()}
            <StyleFunctions name="grid-cols:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="grid-cols:12:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="grid-cols:12@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="grid-cols:12@print"></StyleMediaQueries>
            <StyleColorSchemes name="grid-cols:12@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.grid-columns'

GridColumns.page = {
    layout: CssDoc,
    title: 'Grid Columns',
    description: 'The grid-template-columns CSS property defines the line names and track sizing functions of the grid columns.',
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

