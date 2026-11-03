import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function TextSize() {
    return (
        <>
            <ClassTable names={[
                ['text:`size`','t:`size`'],
            ]}>
            </ClassTable>

            <h2 id="overview">Overview</h2>
            <p>
                The text size style sets the <a href="font-size">font-size</a> and suitable <a href="line-height">line-height</a> in a clever way to make you move faster.
            </p>
            <StyleEditor
                tag="p"
                className="f:28"
                names={[
                    't:28',
                    't:40',
                    't:20px',
                    't:2rem',
                    't:4vw',
                    't:80%',
                    't:calc(100%+1em)'
                ]}
                renderHtml={(className: string) => `
                <div class="..grid-cols:2 w:full h:100 p:10..">
                    <p class="**${className}** ..p:5 grid-col-span:2 word-spacing:4 m:auto..">
                        Virtual CSS
                    </p>
                </div>
                `} />
            <StyleFunctions name="text:$(size)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="text:40:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="text:40@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="text:40@print"></StyleMediaQueries>
            <StyleColorSchemes name="text:40@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.text-size'

TextSize.page = {
    layout: CssDoc,
    title: 'Text Size',
    description: 'The text size style sets the font-size and suitable line-height in a clever way to make you move faster.',
    editors: ['Aron','Lola'],
    localeNamespace
};

export async function getStaticProps({ locale }: any) {
    return {
        props: {
            ...(await serverSideTranslations(locale, ['common', 'css', localeNamespace])),
        },
    };
};

