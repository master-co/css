import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import TextList from '~/components/Css/TextList'
import CssDoc from '~/layouts/CssDoc'

export default function TextDecorationStyle() {

    return (
        <>
            <ClassTable names={[
                ['text-decoration-style:`style`'],
                ['text:none'],
                ['text:dashed'],
                ['text:dotted'],
                ['text:double'],
                ['text:solid'],
                ['text:wavy']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>text-decoration-style</code></strong>&nbsp;<a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property
                sets the style of the lines specified by&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/text-decoration-line" target="blank">text-decoration-line</a>.
                The style applies to all lines that are set with <code>text-decoration-line</code>.
            </p>
            <TextList
                showClasses={[
                    't:none',
                    't:dashed',
                    't:dotted',
                    't:double',
                    't:solid',
                    't:wavy'
                ]}
                renderClasses="f:30 t:underline text-decoration:blue-60"
            >
            </TextList>
            <StyleFunctions name="text-decoration-style:$(style)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="text-decoration-style:solid:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="text-decoration-style:solid@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="text-decoration-style:solid@print"></StyleMediaQueries>
            <StyleColorSchemes name="text-decoration-style:solid@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.text-decoration-style'

TextDecorationStyle.page = {
    layout: CssDoc,
    title: 'Text Decoration Style',
    description: 'The text-decoration-style CSS property sets the style of the lines specified by text-decoration-line. The style applies to all lines that are set with text-decoration-line.',
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