import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function FontSmoothing() {
    return (
        <>
            <ClassTable names={[
                  ['font:antialiased', 'f:antialiased'],
                  ['font:subpixel-antialiased']
            ]}>
            </ClassTable>

            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>font-smoothing</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property 
                controls the application of anti-aliasing when fonts are rendered.
            </p>
            <StyleEditor
                tag="p"
                className="font:normal"
                names={[
                    'font:antialiased',
                    'font:subpixel-antialiased'
                ]}
                renderHtml={(className: string) => `
                <div class="..flex center-content w:full h:100 p:10..">
                    <div class="**${className}** ..font:heavy font:80 text-rendering:auto..">
                        Aa
                    </div>
                </div>
                `} />
            <StyleFunctions name="font:$(smooth-value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="font:antialiased:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="font:antialiased@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="font:antialiased@print"></StyleMediaQueries>
            <StyleColorSchemes name="font:antialiased@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.font-smoothing'

FontSmoothing.page = {
    layout: CssDoc,
    title: 'Font Smoothing',
    description: 'The font-smoothing CSS property controls the application of anti-aliasing when fonts are rendered.',
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

