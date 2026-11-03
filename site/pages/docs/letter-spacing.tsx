import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function LetterSpacing() {
    return (
        <>
            <ClassTable names={[
                ['letter-spacing:`value`', 'ls:`value`']
            ]}>
            </ClassTable>

            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>letter-spacing</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property 
                sets the horizontal spacing behavior between text characters. This value is added to the natural spacing between characters while rendering the text.
                Positive values of letter-spacing causes characters to spread farther apart, while negative values of letter-spacing bring characters closer together.
            </p>
            <StyleEditor
                tag="p"
                className="ls:0"
                names={[
                    'ls:0',
                    'ls:0.5',
                    'ls:1',
                    'ls:10'
                ]}
                hideHtml="true"
                renderHtml={(className: string) => `
                    <p class="**${className}** ..p:5 grid-col-span:2 word-spacing:4 m:auto..">
                        Ladies and gentlemen, the first Virtual CSS came to the world.It will crush all CSS and UI libraries,
                        and subvert your understanding of traditional CSS technology. Keep up with the latest technological trends,
                        he will greatly improve Web interaction and execution efficiency.
                    </p>
                `} />
            <StyleFunctions name="ls:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="ls:1:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="ls:1@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="ls:1@print"></StyleMediaQueries>
            <StyleColorSchemes name="ls:1@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.letter-spacing'

LetterSpacing.page = {
    layout: CssDoc,
    title: 'Letter Spacing',
    description: 'The letter-spacing CSS property sets the horizontal spacing behavior between text characters. This value is added to the natural spacing between characters while rendering the text. Positive values of letter-spacing causes characters to spread farther apart, while negative values of letter-spacing bring characters closer together.',
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

