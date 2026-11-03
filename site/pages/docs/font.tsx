import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import ShorthandList from '~/components/Css/ShorthandList'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function Font() {

    return (
        <>
            <ClassTable names={[
                ['font:`style`|`variant`|`weight`|`size`/`line-height`|`family`', 'f:`style`|`variant`|`weight`|`size`/`line-height`|`family`'],
                ['font:caption'],
                ['font:icon'],
                ['font:menu'],
                ['font:message-box'],
                ['font:small-caption'],
                ['font:status-bar']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>font</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/Shorthand_properties" target="blank">shorthand property</a>&nbsp;
                sets all the different properties of an element&rsquo;s font. 
                Alternatively, it sets an element&rsquo;s font to a system font.
                <br/>
                As with any shorthand property, any individual value that is not specified is set to its corresponding initial value (possibly 
                overriding values previously set using non-shorthand properties). 
                Though not directly settable by font, the longhands <a href="font-size-adjust">font-size-adjust</a> and <a href="font-kerning">font-kerning</a>&nbsp;
                are also reset to their initial values.
                <br/>
                <br/>
                It is a shorthand for:
            </p>
            <ShorthandList items={[
                'font-color',
                'font-family',
                'font-size',
                'font-style',
                'font-variant-numeric',
                'font-weight',
                'font-smoothing'
            ]}>
            </ShorthandList>
            <StyleFunctions name="font:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="font:caption:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="font:caption@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="font:caption@print"></StyleMediaQueries>
            <StyleColorSchemes name="font:caption@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.font'

Font.page = {
    layout: CssDoc,
    title: 'Font',
    description: 'The font CSS shorthand property  sets all the different properties of an element’s font. Alternatively, it sets an element’s font to a system font.',
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