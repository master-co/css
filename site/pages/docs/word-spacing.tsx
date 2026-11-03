import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function WordSpacing() {
    return (
        <>
            <ClassTable names={[
                ['word-spacing:`value`']
            ]}>
            </ClassTable>

            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>word-spacing</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property 
                sets the length of space between words and between tags.
            </p>
            <StyleEditor
                tag="p"
                className="word-spacing:0"
                names={[
                    'word-spacing:0',
                    'word-spacing:5',
                    'word-spacing:10',
                ]}
                hideHtml="true"
                renderHtml={(className: string) => `
                    <p class="**${className}** ..p:5 grid-col-span:2 m:auto..">
                        Ladies and gentlemen, the first Virtual CSS came to the world.It will crush all CSS and UI libraries,
                        and subvert your understanding of traditional CSS technology. Keep up with the latest technological trends,
                        he will greatly improve Web interaction and execution efficiency.
                    </p>
                `} />
            <StyleFunctions name="word-spacing:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="word-spacing:1:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="word-spacing:1@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="word-spacing:1@print"></StyleMediaQueries>
            <StyleColorSchemes name="word-spacing:1@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.word-spacing'

WordSpacing.page = {
    layout: CssDoc,
    title: 'Word Spacing',
    description: 'The word-spacing CSS property sets the length of space between words and between tags.',
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
