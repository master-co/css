import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function PlaceItems() {

    return (
        <>
            <ClassTable names={[
                    ['place-items:`align-items`|`justify-items`'],
                    ['place-items:auto'],
                    ['place-items:normal'],
                    ['place-items:baseline'],
                    ['place-items:center'],
                    ['place-items:stretch'],
                    ['place-items:start'],
                    ['place-items:end'],
                    ['place-items:flex-start'],
                    ['place-items:flex-end'],
                    ['place-items:self-start'],
                    ['place-items:self-end']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>place-items</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/Shorthand_properties" target="blank">shorthand property</a>&nbsp;
                allows you to align items along both the block and inline directions at once (i.e. the <a href="align-items">align-items</a>&nbsp;
                and <a href="justify-items">justify-items</a> properties) in a relevant layout system such as <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout" target="blank">Grid</a>&nbsp;
                or <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Flexible_Box_Layout" target="blank">Flexbox</a>.
                If the second value is not set, the first value is also used for it.
            </p>
            <StyleEditor
                tag="div"
                className="place-items:auto"
                names={[
                    'place-items:auto',
                    'place-items:normal',
                    'place-items:baseline',
                    'place-items:center',
                    'place-items:stretch',
                    'place-items:start',
                    'place-items:end',
                    'place-items:flex-start',
                    'place-items:flex-end',
                    'place-items:self-start',
                    'place-items:self-end'
                ]}
                renderHtml={(className: string) => `
                <div class="**${className}** ..stripe-bg grid-cols:2 w:full h:200 p:10..">
                    <div class="..box m:5!..">1</div>
                    <div class="..box m:5!..">2</div>
                    <div class="..box m:5!..">3</div>
                </div>
                `} />
            <h2 id="basic-usage">Basic usage</h2>
            <h3 id="multiple">Multiple</h3>
            <StyleEditor
                tag="div"
                className="place-items:auto|start"
                names={[
                    'place-items:auto|start',
                    'place-items:end|left',
                    'place-items:normal|right',
                    'place-items:self-end|flex-start',
                    'place-items:self-start|flex-end',
                    'place-items:baseline|stretch',
                    'place-items:center|stretch',
                    'place-items:stretch|center'
                ]}
                renderHtml={(className: string) => `
                <div class="**${className}** grid-cols:2 ..stripe-bg w:full h:200 p:10..">
                    <div class="..box m:5!..">1</div>
                    <div class="..box m:5!..">2</div>
                    <div class="..box m:5!..">3</div>
                </div>
                `} />
            <StyleFunctions name="place-items:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="place-items:baseline:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="place-items:baseline@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="place-items:baseline@print"></StyleMediaQueries>
            <StyleColorSchemes name="place-items:baseline@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.place-items'

PlaceItems.page = {
    layout: CssDoc,
    title: 'Place Items',
    description: 'The place-items CSS shorthand property  allows you to align items along both the block and inline directions at once (i.e. the align-items  and justify-items properties) in a relevant layout system such as Grid  or Flexbox. If the second value is not set, the first value is also used for it.',
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
