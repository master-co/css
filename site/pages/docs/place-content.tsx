import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function PlaceContent() {

    return (
        <>
            <ClassTable names={[
                 ['place-content:`align-content`|`justify-content`'],
                 ['place-content:normal'],
                 ['place-content:baseline'],
                 ['place-content:center'],
                 ['place-content:stretch'],
                 ['place-content:start'],
                 ['place-content:end'],
                 ['place-content:flex-start'],
                 ['place-content:flex-end'],
                 ['place-content:space-around'],
                 ['place-content:space-between'],
                 ['place-content:space-evenly']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>place-content</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/Shorthand_properties" target="blank">shorthand property</a>&nbsp;
                allows you to align content along both the block and inline directions at once (i.e. the&nbsp;
                <a href="align-content">align-content</a> and <a href="justify-content">justify-content</a> properties) in a relevant layout system
                such as <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout" target="blank">Grid</a>&nbsp;
                or <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Flexible_Box_Layout" target="blank">Flexbox</a>.
            </p>
            <StyleEditor
                tag="div"
                className="place-content:normal"
                names={[
                    'place-content:normal',
                    'place-content:baseline',
                    'place-content:center',
                    'place-content:stretch',
                    'place-content:start',
                    'place-content:end',
                    'place-content:flex-start',
                    'place-content:flex-end',
                    'place-content:space-around',
                    'place-content:space-between',
                    'place-content:space-evenly'
                ]}
                renderHtml={(className: string) => `
                <div class="**${className}** d:grid grid-template-cols:repeat(2,minmax(0,60px)) ..stripe-bg w:full h:200..">
                    <div class="..box m:5!..">1</div>
                    <div class="..box m:5!..">2</div>
                    <div class="..box m:5!..">3</div>
                </div>
                `} />
            <h2 id="basic-usage">Basic usage</h2>
            <h3 id="multiple">Multiple</h3>
            <StyleEditor
                tag="div"
                className="place-content:normal|left"
                names={[
                    'place-content:normal|left',
                    'place-content:end|left',
                    'place-content:normal|right',
                    'place-content:end|start',
                    'place-content:start|end',
                    'place-content:baseline;stretch',
                    'place-content:center|stretch',
                    'place-content:stretch|center'
                ]}
                renderHtml={(className: string) => `
                <div class="**${className}** d:grid grid-template-cols:repeat(2,minmax(0,60px)) ..stripe-bg w:full h:200 p:10..">
                    <div class="..box m:5!..">1</div>
                    <div class="..box m:5!..">2</div>
                    <div class="..box m:5!..">3</div>
                </div>
                `} />
            <StyleFunctions name="place-content:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="place-content:baseline:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="place-content:baseline@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="place-content:baseline@print"></StyleMediaQueries>
            <StyleColorSchemes name="place-content:baseline@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.place-content'

PlaceContent.page = {
    layout: CssDoc,
    title: 'Place Content',
    description: 'The place-content CSS shorthand property  allows you to align content along both the block and inline directions at once (i.e. the align-content and justify-content properties) in a relevant layout system such as Grid  or Flexbox.',
    editors: ['Aron','Lola'],
    localeNamespace
,
    mdn: true,
    canIUse: true
};

export async function getStaticProps({ locale }: any) {
    return {
        props: {
            ...(await serverSideTranslations(locale, ['c【ommon', 'css', localeNamespace])),
        },
    };
};
