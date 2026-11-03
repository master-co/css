import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function JustifySelf() {

    return (
        <>
            <ClassTable names={[
                    ['justify-self:`value`', 'js:`value`'],
                    ['justify-self:auto'],
                    ['justify-self:normal'],
                    ['justify-self:baseline'],
                    ['justify-self:left'],
                    ['justify-self:center'],
                    ['justify-self:right'],
                    ['justify-self:stretch'],
                    ['justify-self:start'],
                    ['justify-self:end'],
                    ['justify-self:flex-start'],
                    ['justify-self:flex-end'],
                    ['justify-self:self-start'],
                    ['justify-self:self-end']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>justify-self</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property 
                sets the way a box is justified inside its alignment container along the appropriate axis.
            </p>
            <StyleEditor
                tag="div"
                className="js:auto"
                names={[
                    'js:auto',
                    'js:normal',
                    'js:baseline',
                    'js:left',
                    'js:center',
                    'js:right',
                    'js:stretch',
                    'js:start',
                    'js:end',
                    'js:flex-start',
                    'js:flex-end',
                    'js:self-start',
                    'js:self-end'
                ]}
                renderHtml={(className: string) => `
                <div class="..w:full stripe-bg grid-cols:3 p:10 h:100 gap:20..">
                    <div class="**${className}** ..box focus..">One</div>
                    <div class="..box..">Two</div>
                    <div class="..box..">Three</div>
                </div>
                `} />
            <StyleFunctions name="justify-self:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="justify-self:auto:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="justify-self:auto@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="justify-self:auto@print"></StyleMediaQueries>
            <StyleColorSchemes name="justify-self:auto@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.justify-self'

JustifySelf.page = {
    layout: CssDoc,
    title: 'Justify Self',
    description: 'The justify-self CSS property sets the way a box is justified inside its alignment container along the appropriate axis.',
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