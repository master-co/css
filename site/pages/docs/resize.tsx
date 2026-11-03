import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function Resize() {

    return (
        <>
            <ClassTable names={[
                    ['resize:`value`'],
                    ['resize:auto'],
                    ['resize:none'],
                    ['resize:both'],
                    ['resize:horizontal'],
                    ['resize:vertical'],
                    ['resize:block'],
                    ['resize:inline']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>resize</code></strong>&nbsp;<a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property
                sets whether an element is resizable, and if so, in which directions.
            </p>
            <StyleEditor
                tag="div"
                className="resize:both"
                names={[
                    'resize:both',
                    'resize:none',
                    'resize:horizontal',
                    'resize:vertical',
                ]}
                renderHtml={(className: string) => `
                    <p class="**${className}** overflow:auto ..articleBox..">
                        Ladies and gentlemen, the first Virtual CSS came to the world.<br/>
                        It will crush all CSS and UI libraries, and subvert your understanding of traditional CSS technology.<br/>
                        Keep up with the latest technological trends, he will greatly improve Web interaction and execution efficiency. <br/>
                    </p>
                `}
            />
            <StyleFunctions name="resize:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="resize:both:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="resize:both@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="resize:both@print"></StyleMediaQueries>
            <StyleColorSchemes name="resize:both@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.resize'

Resize.page = {
    layout: CssDoc,
    title: 'Resize',
    description: 'The resize CSS property sets whether an element is resizable, and if so, in which directions.',
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
}
