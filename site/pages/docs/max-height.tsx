import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function MaxHeight() {

    return (
        <>
            <ClassTable names={[
                 ['max-height:`size`', 'max-h:`size`'],
                 ['max-h:full'],
                 ['max-h:fit'],
                 ['max-h:max'],
                 ['max-h:max'],
                 ['max-h:3xs', 'max-h:360'],
                 ['max-h:2xs', 'max-h:480'],
                 ['max-h:xs', 'max-h:600'],
                 ['max-h:sm', 'max-h:768'],
                 ['max-h:md', 'max-h:1024'],
                 ['max-h:lg', 'max-h:1280'],
                 ['max-h:xl', 'max-h:1440'],
                 ['max-h:2xl', 'max-h:1600'],
                 ['max-h:3xl', 'max-h:1920'],
                 ['max-h:4xl', 'max-h:2560'],
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>max-height</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property 
                sets the maximum height of an element.
                It prevents the <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/used_value" target="blank">used value</a>&nbsp;
                of the <a href="height">height</a> property from becoming smaller than the value specified for max-height.
            </p>
            <StyleEditor
                tag="div"
                className="max-h:max"
                names={[
                    'max-h:max',
                    'max-h:full',
                    'max-h:fit',
                    'max-h:200',
                    'max-h:300',
                    'max-h:min',
                ]}
                renderHtml={(className: string) => `
                <div class="h:300 p:15 **${className}** writing-mode:vertical-rl ..articleBox..">
                    <code class=" w:full block ..box focus..">
                        I know CSS very well.
                    </code>
                </div>

                `} />
            <StyleFunctions name="max-h:$(size)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="max-h:full:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="max-h:full@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="max-h:full@print"></StyleMediaQueries>
            <StyleColorSchemes name="max-h:full@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.max-height'

MaxHeight.page = {
    layout: CssDoc,
    title: 'Max Height',
    description: 'The max-height CSS property sets the maximum height of an element. It prevents the used value  of the height property from becoming smaller than the value specified for max-height.',
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

