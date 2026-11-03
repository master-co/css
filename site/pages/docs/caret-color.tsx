import Link from '~/components/Link'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ALink from '~/components/ALink'

export default function CaretColor() {

    return (
        <>
            <ClassTable names={[
                ['caret-color:`color`', 'caret:`color`'],
                ['caret:#`hex`'],
                ['caret:rgb(`rgb`)'],
                ['caret:hsl(`hsl`)'],
                ['caret:transparent']
            ]}>
            </ClassTable>
            <p className="hint">
                Use or name colors please refer to <ALink href="/docs/colors"><code>Colors</code></ALink>.
            </p>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>caret-color</code></strong>&nbsp;<a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property sets
                the <a href="https://developer.mozilla.org/en-US/docs/Glossary/caret">caret</a> color for the <strong>insertion caret</strong>, the visible marker
                where the next character typed will be inserted.
            </p>
            <p>
                This is  sometimes referred to as the <strong>text input cursor</strong>.
                The caret appears in elements such as <code>&lt;input&gt;</code> or those with the <a href="https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes#attr-contenteditable">contenteditable attribute</a>.
                The caret is typically a thin vertical line that flashes to help make it more noticeable. By default, it is black, but its color can be altered
                with this property.
            </p>
            <StyleEditor
                autofocus
                tag="input"
                attrs={{ 'type': 'text' }}
                className="caret-color:auto"
                names={[
                    'caret-color:auto',
                    'caret-color:blue',
                    'caret-color:red'
                ]}
                renderHtml={(className: string) => `
                    <div>
                        <input id="demoInput" type="text" 
                            class="p:5|10 b:1px|solid|gray-44 r:3 w:300 ${className && `**${className}** ~caret-color|.3s`}"
                            value="Focus on input to see the caret color"/>
                    </div>
                `} />
            <StyleFunctions name="caret-color:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="caret-color:blue-60:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="caret-color:blue-60@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="caret-color:blue-60@print"></StyleMediaQueries>
            <StyleColorSchemes name="caret-color:blue-60@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.caret-color'

CaretColor.page = {
    layout: CssDoc,
    title: 'Caret Color',
    description: 'The caret-color CSS property sets the caret color for the insertion caret, the visible marker where the next character typed will be inserted.',
    editors: ['Aron', 'Lola'],
    localeNamespace,
    mdn: true,
    canIUse: true
};

export async function getStaticProps({ locale }: any) {
    return {
        props: {
            ...(await serverSideTranslations(locale, ['common', 'css', localeNamespace])),
        },
    };
}
