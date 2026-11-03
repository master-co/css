import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function TextShadow() {

    return (
        <>
            <ClassTable names={[
                    ['text-shadow:`offset-x`|`offset-y`|`blur-radius`|`color`,`…`'],
                    ['text-shadow:`color`|`offset-x`|`offset-y`|`blur-radius`'],
                    ['text-shadow:`offset-x`|`offset-y`|`color`'],
                    ['text-shadow:`color`|`offset-x`|`offset-y`'],
                    ['text-shadow:`offset-x`|`offset-y`']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>text-shadow</code></strong>&nbsp;<a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property
                adds shadows to text. It accepts a comma-separated list of shadows to be applied to the
                text and any of its <a href="text-decoration">decorations</a>. 
                Each shadow is described by some combination of X and Y offsets from the element, blur radius, and color.
            </p>
            <StyleEditor
                tag="div"
                className="text-shadow:0|0|10"
                names={[
                    'text-shadow:0|0|10',
                    'text-shadow:5|0|10|blue-60',
                    'text-shadow:-5|0|10|pink-60/.5',
                    'text-shadow:5|5|10|indigo-50'

                ]}
                renderHtml={(className: string) => `
                    <p class="**${className}** ..articleBox..">
                        Ladies and gentlemen, the first Virtual CSS came to the world.<br/>
                        It will crush all CSS and UI libraries, and subvert your understanding of traditional CSS technology.<br/>
                        Keep up with the latest technological trends, he will greatly improve Web interaction and execution efficiency. <br/>
                    </p>
                `}
            />
            <StyleFunctions name="text-shadow:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="text-shadow:1|2|3|blue:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="text-shadow:1|2|3|blue@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="text-shadow:1|2|3|blue@print"></StyleMediaQueries>
            <StyleColorSchemes name="text-shadow:1|2|3|blue@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.text-shadow'

TextShadow.page = {
    layout: CssDoc,
    title: 'Text Shadow',
    description: 'The text-shadow CSS property adds shadows to text. It accepts a comma-separated list of shadows to be applied to the text and any of its decorations. Each shadow is described by some combination of X and Y offsets from the element, blur radius, and color.',
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
