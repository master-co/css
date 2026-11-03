import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function TextOrientation() {

    return (
        <>
            <ClassTable names={[
                     ['text-orientation:`value`'],
                     ['text:mixed'],
                     ['text:sideways'],
                     ['text:sideways-right'],
                     ['text:upright'],
                     ['text:use-glyph-orientation']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>text-orientation</code></strong>&nbsp;<a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property
                sets the orientation of the text characters in a line. It only affects text in vertical mode (when writing-mode is not horizontal-tb). 
                It is useful for controlling the display of languages that use vertical script, and also for making vertical table headers.
            </p>
            <StyleEditor
                tag="div"
                className="t:mixed"
                names={[
                    't:mixed',
                    'writing-mode:vertical-rl t:mixed',
                    'writing-mode:vertical-rl t:upright'
                ]}
                renderHtml={(className: string) => `
                    <p class="**${className}** ..articleBox..">
                        Ladies and gentlemen, the first Virtual CSS came to the world.It will crush all CSS and UI libraries,
                        and subvert your understanding of traditional CSS technology. Keep up with the latest technological trends,
                        he will greatly improve Web interaction and execution efficiency.
                    </p>
                `}
            />
            <StyleFunctions name="text-orientation:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="text-orientation:mixed:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="text-orientation:mixed@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="text-orientation:mixed@print"></StyleMediaQueries>
            <StyleColorSchemes name="text-orientation:mixed@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.text-orientation'

TextOrientation.page = {
    layout: CssDoc,
    title: 'Text Orientation',
    description: 'The text-orientation CSS property sets the orientation of the text characters in a line. It only affects text in vertical mode (when writing-mode is not horizontal-tb). It is useful for controlling the display of languages that use vertical script, and also for making vertical table headers.',
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
