import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function FontSize() {
    return (
        <>
            <ClassTable names={[
                ['font-size:`size`', 'font:`size`', 'f:`size`']
            ]}>
            </ClassTable>

            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>font-size</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property 
                sets the size of the font. Changing the font size also updates the sizes of the font size-relative&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/length" target="blank"><code>&lt;length&gt;</code></a> units, such as&nbsp;<code>em</code>, <code>ex</code>, and so forth.
            </p>
            <StyleEditor
                tag="p"
                className="f:28"
                names={[
                    'f:28',
                    'font:40',
                    'f:20px',
                    'f:2rem',
                    'f:4vw',
                    'f:80%',
                    'font-size:inherit',
                    'font-size:calc(100%+1em)'
                ]}
                renderHtml={(className: string) => `
                <div class="..grid-cols:2 w:full h:100 p:10..">
                    <p class="**${className}** ..p:5 grid-col-span:2 word-spacing:4 m:auto..">
                        Virtual CSS
                    </p>
                </div>
                `} />
            <StyleFunctions name="font-size:$(size)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="font-size:14:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="font-size:14@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="font-size:14@print"></StyleMediaQueries>
            <StyleColorSchemes name="font-size:14@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.font-size'

FontSize.page = {
    layout: CssDoc,
    title: 'Font Size',
    description: 'The font-size CSS property sets the size of the font. Changing the font size also updates the sizes of the font size-relative <length> units, such as em, ex, and so forth.',
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

