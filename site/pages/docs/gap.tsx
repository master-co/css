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

export default function Gap() {

    return (
        <>
            <ClassTable names={[
                ['gap:`size`'],
                ['gap:`row-gap`|`col-gap`'],
                ['gap-x:`col-gap`'],
                ['gap-y:`row-gap`']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                <p>The <strong><code>gap</code></strong> <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property sets the gaps (<a href="https://developer.mozilla.org/en-US/docs/Glossary/Gutters" target="blank">gutters</a>) between rows and columns. It is a <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/Shorthand_properties" target="blank">shorthand</a> for <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/row-gap" target="blank"><code>row-gap</code></a> and <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/column-gap" target="blank"><code>column-gap</code></a>.</p>
            </p>
            <StyleEditor
                tag="div"
                hideTagInput
                className="gap:10"
                hideHtml
                names={[
                    'gap:10',
                    'gap:10|20'
                ]}
                renderHtml={(className: string) => `
                <div class="grid-cols:12 **${className}** w:full ..stripe-bg..">
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
            <h3 id="add-gaps-to-a-grid">Add gaps to a grid</h3>
            {(() => {
                const code = `
                    <div class="grid-cols:3 **gap:10** w:full ..stripe-bg..">
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
            <h3 id="add-gaps-to-a-flex">Add gaps to a flex</h3>
            {(() => {
                const code = `
                    <div class="flex **gap:10** ..stripe-bg..">
                        <div class="box">1</div>
                        <div class="box">2</div>
                        <div class="box">3</div>
                        <div class="box">4</div>
                    </div>
                `
                return (
                    <>
                        <Demo html={code}></Demo>
                        <Code lang="html">{code}</Code>
                    </>
                )
            })()}
            <StyleFunctions name="gap:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="gap:12:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="gap:12@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="gap:12@print"></StyleMediaQueries>
            <StyleColorSchemes name="gap:12@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.gap'

Gap.page = {
    layout: CssDoc,
    title: 'Gap',
    description: 'The gap CSS property sets the gaps (gutters) between rows and columns. It is a shorthand for row-gap and column-gap.',
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
