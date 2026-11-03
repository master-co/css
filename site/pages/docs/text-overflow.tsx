import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function TextOverflow() {

    return (
        <>
            <ClassTable names={[
                ['text-overflow:`value`'],
                ['text:clip'],
                ['text:ellipsis']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>text-overflow</code></strong>&nbsp;<a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property
                sets how hidden overflow content is signaled to users. 
                It can be clipped, display an ellipsis (<code>…</code>), or display a custom string.
            </p>
            <StyleEditor
                tag="div"
                className="t:clip"
                names={[
                    't:clip',
                    't:ellipsis'
                ]}
                renderHtml={(className: string) => `
                    <p class="**${className}** w:1/2 white-space:nowrap overflow:hidden ..articleBox..">
                        Ladies and gentlemen, the first Virtual CSS came to the world.<br/>
                        It will crush all CSS and UI libraries, and subvert your understanding of traditional CSS technology.<br/>
                        Keep up with the latest technological trends, he will greatly improve Web interaction and execution efficiency. <br/>
                    </p>
                `}
            />
            <StyleFunctions name="text-overflow:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="text-overflow:clip:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="text-overflow:clip@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="text-overflow:clip@print"></StyleMediaQueries>
            <StyleColorSchemes name="text-overflow:clip@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.text-overflow'

TextOverflow.page = {
    layout: CssDoc,
    title: 'Text Overflow',
    description: 'The text-overflow CSS property sets how hidden overflow content is signaled to users. It can be clipped, display an ellipsis (…), or display a custom string.',
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
