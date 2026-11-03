import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function TextIndent() {

    return (
        <>
            <ClassTable names={[
               ['text-indent:`offset`']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>text-indent</code></strong>&nbsp;<a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property
                sets the length of empty space (indentation) that is put before lines of text in a block.
            </p>
            <StyleEditor
                tag="div"
                className="text-indent:0"
                names={[
                    'text-indent:0',
                    'text-indent:20',
                    'text-indent:-20'
                ]}
                renderHtml={(className: string) => `
                    <p class="**${className}** ..articleBox..">
                        Ladies and gentlemen, the first Virtual CSS came to the world.It will crush all CSS and UI libraries,
                        and subvert your understanding of traditional CSS technology. Keep up with the latest technological trends,
                        he will greatly improve Web interaction and execution efficiency.
                    </p>
                `}
            />
            <StyleFunctions name="text-indent:$(offset)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="text-indent:10:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="text-indent:10@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="text-indent:10@print"></StyleMediaQueries>
            <StyleColorSchemes name="text-indent:10@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.text-indent'

TextIndent.page = {
    layout: CssDoc,
    title: 'Text Indent',
    description: 'The text-indent CSS property sets the length of empty space (indentation) that is put before lines of text in a block.',
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