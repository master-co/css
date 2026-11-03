import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function MinHeight() {

    return (
        <>
            <ClassTable names={[
                 ['min-height:`size`', 'min-h:`size`'],
                 ['min-h:full'],
                 ['min-h:fit'],
                 ['min-h:max'],
                 ['min-h:max'],
                 ['min-h:3xs', 'min-h:360'],
                 ['min-h:2xs', 'min-h:480'],
                 ['min-h:xs', 'min-h:600'],
                 ['min-h:sm', 'min-h:768'],
                 ['min-h:md', 'min-h:1024'],
                 ['min-h:lg', 'min-h:1280'],
                 ['min-h:xl', 'min-h:1440'],
                 ['min-h:2xl', 'min-h:1600'],
                 ['min-h:3xl', 'min-h:1920'],
                 ['min-h:4xl', 'min-h:2560'],
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>min-height</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property 
                sets the minimum height of an element.
                It prevents the <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/used_value" target="blank">used value</a>&nbsp;
                of the <a href="height">height</a> property from becoming smaller than the value specified for min-height.
            </p>
            <StyleEditor
                tag="div"
                className="min-h:max"
                names={[
                    'min-h:max',
                    'min-h:full',
                    'min-h:fit',
                    'min-h:min',
                    'min-h:200',
                    'min-h:300',
                ]}
                renderHtml={(className: string) => `
                <div class="w:200 h:200 p:15 **${className}** writing-mode:vertical-rl ..articleBox..">
                    <code class=" w:full block ..box focus..">
                        I know CSS very well.
                    </code>
                </div>

                `} />
            <StyleFunctions name="min-h:$(size)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="min-h:full:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="min-h:full@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="min-h:full@print"></StyleMediaQueries>
            <StyleColorSchemes name="min-h:full@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.min-height'

MinHeight.page = {
    layout: CssDoc,
    title: 'Min Height',
    description: 'The min-height CSS property sets the minimum height of an element. It prevents the used value  of the height property from becoming smaller than the value specified for min-height.',
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

