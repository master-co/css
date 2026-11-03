import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import BoxList from '~/components/Css/BoxList'
import ClassTable from '~/components/Css/ClassTable'
import ShorthandList from '~/components/Css/ShorthandList'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function Border() {
    return (
        <>
            <ClassTable names={[
                ['border:`size`|`style`|`color`', 'b:`size`|`style`|`color`'],
                ['border-top:`size`|`style`|`color`', 'bt:`size`|`style`|`color`'],
                ['border-bottom:`size`|`style`|`color`', 'bb:`size`|`style`|`color`'],
                ['border-left:`size`|`style`|`color`', 'bl:`size`|`style`|`color`'],
                ['border-right:`size`|`style`|`color`', 'br:`size`|`style`|`color`'],
                ['bx:`size`|`style`|`color`'],
                ['by:`size`|`style`|`color`']
            ]}>
            </ClassTable>
            <p className="hint">
                The border property may be specified using two or three of the values ( style, size, color ). The order of the
                values does not matter.
            </p>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>border</code></strong>&nbsp;<a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property sets an element&rsquo;s border.
                <br/>
                <br/>
                It is a shorthand for:
            </p>
            <ShorthandList items={[
                'border-color',
                'border-style',
                'border-width',
                'border-radius'
            ]}>
            </ShorthandList>
            <StyleEditor
                autofocus
                tag="div"
                className="b:2|solid|blue-40"
                names={[
                    'b:2|solid|blue-40',
                    'bx:8|dashed|gray-30',
                    'by:3|dotted|red-28',
                    'bt:3|inset|pink-52',
                    'bb:1.5|outset|cyan-70',
                    'bl:5|double',
                    'br:5|groove|red-70'
                ]}
                renderHtml={(className: string) => `
                    <div class="w:full align-items:center t:center">
                        <code class="**${className}** ..p:12|15 f:14 bg:fade-90 bg:gray-20@dark..">Virtual CSS</code>
                    </div>
                `} />
            <h2 id="basic-usage">Basic usage</h2>
            <h3 id="all-side">All sides</h3>
            <StyleEditor
                autofocus
                tag="div"
                className="b:2|solid|blue-60"
                names={[
                    'b:2|solid|blue-60'
                ]}
                hideHtml="true"
                renderHtml={(className: string) => `
                    <div class="w:full align-items:center t:center">
                        <code class="**${className}** p:12|15 f:14">Virtual CSS</code>
                    </div>
                `} />
            <h3 id="single-side">Single side</h3>
            <p>
                Using <code>bt</code>, <code>bb</code>, <code>bl</code>, <code>br</code> to set the border of single side.
            </p>
            <BoxList
                showClasses={[
                    'bt:5',
                    'bb:5',
                    'bl:5',
                    'br:5',
                ]}
                renderClasses="b:blue-60">
            </BoxList>
            <h3 id="both-side">Both sides</h3>
            <p>
                Using <code>bx</code>, <code>by</code> to set the border of vertical or horizontal side.
            </p>
            <BoxList
                showClasses={[
                    'bx:5',
                    'by:5',
                    'bx:10 by:1',
                    'bx:1 by:10',
                ]}
                renderClasses="b:blue-60">
            </BoxList>
            <StyleFunctions name="border:$(style)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="border:1|solid|blue-60:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="border:1|solid|blue-60@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="border:1|solid|blue-60@print"></StyleMediaQueries>
            <StyleColorSchemes name="border:1|solid|blue-60@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.border'

Border.page = {
    layout: CssDoc,
    title: 'Border',
    description: 'The border CSS property sets an element’s border.',
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

