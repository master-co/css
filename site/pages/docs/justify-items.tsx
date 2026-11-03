import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function JustifyItems() {

    return (
        <>
            <ClassTable names={[
                 ['justify-items:`value`', 'ji:`value`'],
                 ['justify-items:auto'],
                 ['justify-items:normal'],
                 ['justify-items:baseline'],
                 ['justify-items:left'],
                 ['justify-items:center'],
                 ['justify-items:right'],
                 ['justify-items:stretch'],
                 ['justify-items:legacy'],
                 ['justify-items:start'],
                 ['justify-items:end'],
                 ['justify-items:flex-start'],
                 ['justify-items:flex-end'],
                 ['justify-items:self-start'],
                 ['justify-items:self-end']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>justify-items</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property 
                defines the default <a href="justify-self">justify-self</a> for all items of the box, 
                giving them all a default way of justifying each box along the appropriate axis.
            </p>
            <StyleEditor
                tag="div"
                className="ji:auto"
                names={[
                    'ji:auto',
                    'ji:normal',
                    'ji:baseline',
                    'ji:left',
                    'ji:center',
                    'ji:right',
                    'ji:stretch',
                    'ji:legacy',
                    'ji:start',
                    'ji:end',
                    'ji:flex-start',
                    'ji:flex-end',
                    'ji:self-start',
                    'ji:self-end'
                ]}
                renderHtml={(className: string) => `
                <div class="**${className}** ..grid-cols:2 gap:20 p:10 w:full h:200 stripe-bg..">
                    <div class="..box..">One</div>
                    <div class="..box..">Two</div>
                    <div class="..box..">Three</div>
                </div>
                `} />
            <StyleFunctions name="justify-items:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="justify-items:normal:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="justify-items:normal@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="justify-items:normal@print"></StyleMediaQueries>
            <StyleColorSchemes name="justify-items:normal@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.justify-items'

JustifyItems.page = {
    layout: CssDoc,
    title: 'Justify Items',
    description: 'The justify-items CSS property defines the default justify-self for all items of the box, giving them all a default way of justifying each box along the appropriate axis.',
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