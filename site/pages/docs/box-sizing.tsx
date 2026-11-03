import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function BoxSizing() {

    return (
        <>
            <ClassTable names={[
                ['box-sizing:`value`', 'box:`value`'],
                ['box:content'],
                ['box:border']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>box-sizing</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property
                sets how the total width and height of an element is calculated.
            </p>
            <StyleEditor
                tag="div"
                className="box:content"
                names={[
                    'box:content',
                    'box:border',
                ]}
                renderHtml={(className: string) => `
                    <div class="**${className}** bg:blue-50 w:80 h:80 p:20 b:5|solid|white/.5">
                        <div class="stripe-bg full"></div>
                    </div>
                `} />
            <StyleFunctions name="box-sizing:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="box-sizing:1/1:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="box-sizing:1/1@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="box-sizing:1/1@print"></StyleMediaQueries>
            <StyleColorSchemes name="box-sizing:1/1@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.box-sizing'

BoxSizing.page = {
    layout: CssDoc,
    title: 'Box Sizing',
    description: 'The box-sizing CSS property sets how the total width and height of an element is calculated.',
    editors: ['Aron', 'Lola'],
    localeNamespace,
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

