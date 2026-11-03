import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function WordBreak() {

    return (
        <>
            <ClassTable names={[
               ['word-break:`value`'],
               ['word-break:normal'],
               ['word-break:break-all'],
               ['word-break:keep-all'],
               ['break-word']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>word-break</code></strong>&nbsp;<a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property
                sets whether line breaks appear wherever the text would otherwise overflow its content box.
            </p>
            <StyleEditor
                tag="div"
                className="break-word"
                names={[
                    'break-word',
                    'word-break:normal',
                    'word-break:break-all',
                    'word-break:keep-all'
                ]}
                renderHtml={(className: string) => `
                    <p class="**${className}** ..articleBox w:1/2..">
                        Ladies and gentlemen, the first Virtual CSS came to the world.
                        It_will_crush_all_CSS_and_UI_libraries,
                        and_subvert_your_understanding_of_traditional_CSS_technology. 
                        Keep_up_with_the_latest_technological_trends,
                        he_will_greatly_improve_Web_interaction_and_execution_efficiency.
                    </p>
                `}
            />
            <StyleFunctions name="word-break:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="word-break:normal:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="word-break:normal@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="word-break:normal@print"></StyleMediaQueries>
            <StyleColorSchemes name="word-break:normal@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.word-break'

WordBreak.page = {
    layout: CssDoc,
    title: 'Word Break',
    description: 'The word-break CSS property sets whether line breaks appear wherever the text would otherwise overflow its content box.',
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
