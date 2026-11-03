import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import TextList from '~/components/Css/TextList'
import CssDoc from '~/layouts/CssDoc'

export default function TextDecorationLine() {

    return (
        <>
            <ClassTable names={[
                ['text-decoration-line:`line`|`…`'],
                ['text:none'],
                ['text:underline'],
                ['text:overline'],
                ['text:line-through']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>text-decoration-inline</code></strong>&nbsp;<a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property
                the position of the lines specified by&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/text-decoration-line" target="blank">text-decoration-line</a>.
            </p>
            <TextList 
                showClasses={[
                    't:none',
                    't:underline',
                    't:overline',
                    't:line-through'
                ]}
                renderClasses="f:30 text-decoration-color:blue-60"
                >
            </TextList>
            <StyleFunctions name="text-decoration-line:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="text-decoration-line:underline:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="text-decoration-line:underline@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="text-decoration-line:underline@print"></StyleMediaQueries>
            <StyleColorSchemes name="text-decoration-line:underline@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.text-decoration-line'

TextDecorationLine.page = {
    layout: CssDoc,
    title: 'Text Decoration Line',
    description: 'The text-decoration-inline CSS property the position of the lines specified by text-decoration-line.',
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

