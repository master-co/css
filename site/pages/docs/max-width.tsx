import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function MaxWidth() {

    return (
        <>
            <ClassTable names={[
                ['max-width:`size`', 'max-w:`size`'],
                ['max-w:full'],
                ['max-w:fit'],
                ['max-w:max'],
                ['max-w:max'],
                ['max-w:3xs', 'max-w:360'],
                ['max-w:2xs', 'max-w:480'],
                ['max-w:xs', 'max-w:600'],
                ['max-w:sm', 'max-w:768'],
                ['max-w:md', 'max-w:1024'],
                ['max-w:lg', 'max-w:1280'],
                ['max-w:xl', 'max-w:1440'],
                ['max-w:2xl', 'max-w:1600'],
                ['max-w:3xl', 'max-w:1920'],
                ['max-w:4xl', 'max-w:2560'],
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>max-width</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property
                sets the maximum width of an element.
                It prevents the <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/used_value" target="blank">used value</a>&nbsp;
                of the <a href="width">width</a> property from becoming smaller than the value specified for max-width.
            </p>
            <StyleEditor
                tag="div"
                className="max-w:max"
                names={[
                    'max-w:max',
                    'max-w:full',
                    'max-w:fit',
                    'max-w:300',
                    'max-w:min',
                ]}
                renderHtml={(className: string) => `
                <div class="w:900 p:15 **${className}** ..articleBox..">
                    <code class=" w:full block ..box focus..">
                        I know CSS very well.
                    </code>
                </div>

                `} />
            <StyleFunctions name="max-w:$(size)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="max-w:full:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="max-w:full@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="max-w:full@print"></StyleMediaQueries>
            <StyleColorSchemes name="max-w:full@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.max-width'

MaxWidth.page = {
    layout: CssDoc,
    title: 'Max Width',
    description: 'The max-width CSS property sets the maximum width of an element. It prevents the used value  of the width property from becoming smaller than the value specified for max-width.',
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
