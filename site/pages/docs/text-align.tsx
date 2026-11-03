import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function TextAlign() {

    return (
        <>
            <ClassTable names={[
                ['text-align:`align`', 'text:`align`', 't:`align`'],
                ['text:start'],
                ['text:end'],
                ['text:left'],
                ['text:right'],
                ['text:center'],
                ['text:justify']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>text-align</code></strong>&nbsp;<a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property
                sets the horizontal alignment of the content inside a block element or table-cell box.
                This means it works like <a href=" vertical-align" target="blank">vertical-align</a> but in the horizontal direction.
            </p>
            <StyleEditor
                tag="div"
                className="text:start"
                hideTagInput
                demoClassName="py:0"
                names={[
                    'text:start',
                    'text:end',
                    'text:left',
                    'text:right',
                    'text:center',
                    'text:justify'
                ]}
                renderHtml={(className: string) => `
                    ~~<div class="grid-cols:2 gap:32 docCard py:16">~~
                        <p class="**${className}** direction:ltr ...">~~<code>ltr</code><br>~~The text-align CSS ..property sets the horizontal alignment of the content inside a block element or table-cell box. This means it works like vertical-align but in the horizontal direction. ..</p>
                        <p class="**${className}** direction:rtl ...">~~<code>rtl</code><br>~~The text-align CSS ..property sets the horizontal alignment of the content inside a block element or table-cell box. This means it works like vertical-align but in the horizontal direction. ..</p>
                    ~~</div>~~
                `}
            />
            <StyleFunctions name="text-align:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="text-align:center:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="text-align:center@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="text-align:center@print"></StyleMediaQueries>
            <StyleColorSchemes name="text-align:center@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.text-align'

TextAlign.page = {
    layout: CssDoc,
    title: 'Text Align',
    description: 'The text-align CSS property sets the horizontal alignment of the content inside a block element or table-cell box. This means it works like vertical-align but in the horizontal direction.',
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

