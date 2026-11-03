import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function TextRendering() {

    return (
        <>
            <ClassTable names={[
                    ['text-rendering:`value`'],
                    ['text-rendering:auto'],
                    ['text:optimizeSpeed'],
                    ['text:optimizeLegibility'],
                    ['text:geometricPrecision']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>text-rendering</code></strong>&nbsp;<a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property
                provides information to the rendering engine about what to optimize for when rendering text.
            </p>
            <StyleEditor
                tag="div"
                className="text-rendering:auto"
                names={[
                    'text-rendering:auto',
                    'text:optimizeSpeed',
                    'text:optimizeLegibility',
                    'text:geometricPrecision'
                ]}
                renderHtml={(className: string) => `
                    <p class="**${className}** ..articleBox..">
                        Ladies and gentlemen, the first Virtual CSS came to the world.It will crush all CSS and UI libraries,
                        and subvert your understanding of traditional CSS technology. Keep up with the latest technological trends,
                        he will greatly improve Web interaction and execution efficiency.
                    </p>
                `}
            />
            <StyleFunctions name="text-rendering:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="text-rendering:auto:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="text-rendering:uppautoercase@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="text-rendering:auto@print"></StyleMediaQueries>
            <StyleColorSchemes name="text-rendering:auto@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.text-rendering'

TextRendering.page = {
    layout: CssDoc,
    title: 'Text Rendering',
    description: 'The text-rendering CSS property provides information to the rendering engine about what to optimize for when rendering text.',
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

