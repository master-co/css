import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function MinWidth() {

    return (
        <>
            <ClassTable names={[
                ['min-width:`size`', 'min-w:`size`'],
                ['min-w:full'],
                ['min-w:fit'],
                ['min-w:max'],
                ['min-w:max'],
                ['min-w:3xs', 'min-w:360'],
                ['min-w:2xs', 'min-w:480'],
                ['min-w:xs', 'min-w:600'],
                ['min-w:sm', 'min-w:768'],
                ['min-w:md', 'min-w:1024'],
                ['min-w:lg', 'min-w:1280'],
                ['min-w:xl', 'min-w:1440'],
                ['min-w:2xl', 'min-w:1600'],
                ['min-w:3xl', 'min-w:1920'],
                ['min-w:4xl', 'min-w:2560'],
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>min-width</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property
                sets the minimum width of an element.
                It prevents the <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/used_value" target="blank">used value</a>&nbsp;
                of the <a href="width">width</a> property from becoming smaller than the value specified for min-width.
            </p>
            <StyleEditor
                tag="div"
                className="min-w:max"
                names={[
                    'min-w:max',
                    'min-w:full',
                    'min-w:fit',
                    'min-w:300',
                    'min-w:min',
                ]}
                renderHtml={(className: string) => `
                <div class="w:200 p:15 **${className}** ..articleBox..">
                    <code class=" w:full block ..box focus..">
                        I know CSS very well.
                    </code>
                </div>

                `} />
            <StyleFunctions name="min-w:$(size)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="min-w:full:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="min-w:full@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="min-w:full@print"></StyleMediaQueries>
            <StyleColorSchemes name="min-w:full@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.min-width'

MinWidth.page = {
    layout: CssDoc,
    title: 'Min Width',
    description: 'The min-width CSS property sets the minimum width of an element. It prevents the used value  of the width property from becoming smaller than the value specified for min-width.',
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
