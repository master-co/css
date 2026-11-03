import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function AlignSelf() {

    return (
        <>
            <ClassTable names={[
                   ['align-self:`value`', 'as:`value`'],
                   ['align-self:auto'],
                   ['align-self:normal'],
                   ['align-self:baseline'],
                   ['align-self:center'],
                   ['align-self:stretch'],
                   ['align-self:start'],
                   ['align-self:end'],
                   ['align-self:flex-start'],
                   ['align-self:flex-end'],
                   ['align-self:self-start'],
                   ['align-self:self-end']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>align-self</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property 
                overrides a grid or flex item&rsquo;s <a href="align-items">align-items</a> value.
                In Grid, it aligns the item inside the <a href="https://developer.mozilla.org/en-US/docs/Glossary/Grid_Areas" target="blank">grid area</a>.
                In Flexbox, it aligns the item on the <a href="https://developer.mozilla.org/en-US/docs/Glossary/Cross_Axis" target="blank">Cross Axis</a>.
            </p>
            <StyleEditor
                tag="div"
                className="as:auto"
                names={[
                    'as:auto',
                    'as:normal',
                    'as:baseline',
                    'as:center',
                    'as:stretch',
                    'as:start',
                    'as:end',
                    'as:flex-start',
                    'as:flex-end',
                    'as:self-start',
                    'as:self-end'
                ]}
                renderHtml={(className: string) => `
                <div class="..w:full stripe-bg grid-cols:3 p:10 h:100 gap:20..">
                    <div class="**${className}** ..box focus..">One</div>
                    <div class="..box..">Two</div>
                    <div class="..box..">Three</div>
                </div>
                `} />
            <StyleFunctions name="align-self:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="align-self:auto:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="align-self:auto@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="align-self:auto@print"></StyleMediaQueries>
            <StyleColorSchemes name="align-self:auto@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.align-self'

AlignSelf.page = {
    layout: CssDoc,
    title: 'Align Self',
    description: 'The align-self CSS property overrides a grid or flex item’s align-items value. In Grid, it aligns the item inside the grid area. In Flexbox, it aligns the item on the Cross Axis.',
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
