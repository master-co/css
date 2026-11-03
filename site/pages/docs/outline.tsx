import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import ShorthandList from '~/components/Css/ShorthandList'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function Outline() {
    return (
        <>
            <ClassTable names={[
                ['outline:`style`'],
                ['outline:`color`|`style`'],
                ['outline:`style`|`width`'],
                ['outline:`color`|`style`|`width`']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>outline</code></strong>&nbsp;<a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/Shorthand_properties" target="blank">shorthand property</a>&nbsp;
                set all the outline properties in a single declaration.
                <br/>
                <br/>
                It is a shorthand for:
            </p>
            <ShorthandList items={[
                'outline-color',
                'outline-offset',
                'outline-style',
                'outline-width'
            ]}>
            </ShorthandList>
            <StyleEditor
                autofocus
                tag="div"
                className="outline:2|solid|blue-60"
                names={[
                    'outline:2|solid|blue-60',
                    'outline:4|inset|gray-30',
                    'outline:6|outset|pink-60',
                    'outline:4|dashed',
                    'outline:6|dotted'
                ]}
                renderHtml={(className: string) => `
                    <div class="w:full align-items:center t:center">
                        <code class="**${className}** ..p:12|15 f:14 bg:fade-90 bg:gray-20@dark..">Virtual CSS</code>
                    </div>
                `} />
            <StyleFunctions name="outline:$(style)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="outline:1|solid|blue-60:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="outline:1|solid|blue-60@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="outline:1|solid|blue-60@print"></StyleMediaQueries>
            <StyleColorSchemes name="outline:1|solid|blue-60@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.outline'

Outline.page = {
    layout: CssDoc,
    title: 'Outline',
    description: 'The outline CSS shorthand property  set all the outline properties in a single declaration.',
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
