import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function TextUnderlineOffset() {

    return (
        <>
            <ClassTable names={[
               ['text-underline-offset:`offset`']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>text-underline-offset</code></strong>&nbsp;<a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property
                sets the offset distance of an underline text decoration line (applied using <a href="text-decoration">text-decoration</a>) from its original position.
            </p>
            <StyleEditor
                tag="div"
                className="text-underline-offset:0"
                names={[
                    'text-underline-offset:0',
                    'text-underline-offset:5',
                    'text-underline-offset:10',
                    'text-underline-offset:20'
                ]}
                renderHtml={(className: string) => `
                    <p class="**${className}** f:40 t:underline text-decoration:blue-60">
                        Virual CSS
                    </p>
                `}
            />
            <StyleFunctions name="text-underline-offset:$(offset)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="text-underline-offset:1:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="text-underline-offset:1@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="text-underline-offset:1@print"></StyleMediaQueries>
            <StyleColorSchemes name="text-underline-offset:1@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.text-underline-offset'

TextUnderlineOffset.page = {
    layout: CssDoc,
    title: 'Text Underline Offset',
    description: 'The text-underline-offset CSS property sets the offset distance of an underline text decoration line (applied using text-decoration) from its original position.',
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

