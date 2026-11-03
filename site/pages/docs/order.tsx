import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function Order() {

    return (
        <>
            <ClassTable names={[
                    ['order:`value`', 'o:`value`'],
                    ['o:first'],
                    ['o:last']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>order</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property 
                sets the order to lay out an item in a flex or grid container.
                Items in a container are sorted by ascending <code>order</code> value and then by their source code order.
            </p>
            <StyleEditor
                tag="div"
                className="o:first"
                names={[
                    'o:first',
                    'o:last'
                ]}
                renderHtml={(className: string) => `
                <div class="..w:full stripe-bg p:10 flex gap:10..">
                    <div class="o:-3 ..box..">1</div>
                    <div class="o:-1 ..box..">2</div>
                    <div class="**${className}** flex:1 ..box focus..">${className}</div>
                    <div class="o:1 ..box..">4</div>
                    <div class="o:3 ..box..">5</div>
                </div>
                `} />
            <StyleFunctions name="o:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="o:first:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="o:first@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="o:first@print"></StyleMediaQueries>
            <StyleColorSchemes name="o:first@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.order'

Order.page = {
    layout: CssDoc,
    title: 'Order',
    description: 'The order CSS property sets the order to lay out an item in a flex or grid container. Items in a container are sorted by ascending order value and then by their source code order.',
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

