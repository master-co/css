import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function PlaceSelf() {

    return (
        <>
            <ClassTable names={[
                    ['place-self:`align-self`|`justify-self`'],
                    ['place-self:auto'],
                    ['place-self:normal'],
                    ['place-self:baseline'],
                    ['place-self:center'],
                    ['place-self:stretch'],
                    ['place-self:start'],
                    ['place-self:end'],
                    ['place-self:flex-start'],
                    ['place-self:flex-end'],
                    ['place-self:self-start'],
                    ['place-self:self-end']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>place-self</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/Shorthand_properties" target="blank">shorthand property</a>&nbsp;
                allows you to align an individual item in both the block and inline directions at once (i.e. the&nbsp;
                <a href="align-self">align-self</a> and <a href="justify-self">justify-self</a> properties) in a relevant layout system such as&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout" target="blank">Grid</a> or&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Flexible_Box_Layout" target="blank">Flexbox</a>. 
                If the second value is not present, the first value is also used for it.
            </p>
            <StyleEditor
                tag="div"
                className="place-self:auto"
                names={[
                    'place-self:auto',
                    'place-self:normal',
                    'place-self:baseline',
                    'place-self:center',
                    'place-self:stretch',
                    'place-self:start',
                    'place-self:end',
                    'place-self:flex-start',
                    'place-self:flex-end',
                    'place-self:self-start',
                    'place-self:self-end'
                ]}
                renderHtml={(className: string) => `
                <div class="..stripe-bg grid-cols:3 w:full h:100 p:10..">
                    <div class="**${className}** ..box focus m:5!..">1</div>
                    <div class="..box m:5!..">2</div>
                    <div class="..box m:5!..">3</div>
                </div>
                `} />
            <h2 id="basic-usage">Basic usage</h2>
            <h3 id="multiple">Multiple</h3>
            <StyleEditor
                tag="div"
                className="place-self:auto|start"
                names={[
                    'place-self:auto|start',
                    'place-self:end|left',
                    'place-self:normal|right',
                    'place-self:self-end|flex-start',
                    'place-self:self-start|flex-end',
                    'place-self:baseline|stretch',
                    'place-self:center|stretch',
                    'place-self:stretch|center'
                ]}
                renderHtml={(className: string) => `
                <div class="grid-cols:3 ..stripe-bg w:full h:200 p:10..">
                    <div class="**${className}** ..box focus m:5!..">1</div>
                    <div class="..box m:5!..">2</div>
                    <div class="..box m:5!..">3</div>
                </div>
                `} />
            <StyleFunctions name="place-self:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="place-self:baseline:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="place-self:baseline@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="place-self:baseline@print"></StyleMediaQueries>
            <StyleColorSchemes name="place-self:baseline@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.place-self'

PlaceSelf.page = {
    layout: CssDoc,
    title: 'Place Self',
    description: 'The place-self CSS shorthand property  allows you to align an individual item in both the block and inline directions at once (i.e. the align-self and justify-self properties) in a relevant layout system such as Grid or Flexbox. If the second value is not present, the first value is also used for it.',
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

