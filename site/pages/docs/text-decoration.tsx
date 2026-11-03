import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import ShorthandList from '~/components/Css/ShorthandList'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function TextDecoration() {

    return (
        <>
            <ClassTable names={[
                 'text-decoration:`line`|`color`|`style`|`thickness`',
                 ['text:underline'],
                 ['text:line-through'],
                 ['text:overline']
            ]}>
            </ClassTable>
            <p>
                The text-decoration property may be specified using one or more of the values (line, color, style, thickness).
                The order of the values does not matter.
            </p>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>text-decoration</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/Shorthand_properties" target="blank">shorthand property</a>&nbsp;
                sets the appearance of decorative lines on text.
                <br/>
                <br/>
                It is a shorthand for:
            </p>
            <ShorthandList items={[
                'text-decoration-color',
                'text-decoration-line',
                'text-decoration-style',
                'text-decoration-thickness'
            ]}>
            </ShorthandList>
            <StyleFunctions name="text-decoration:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="text-decoration:underline:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="text-decoration:underline@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="text-decoration:underline@print"></StyleMediaQueries>
            <StyleColorSchemes name="text-decoration:underline@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.text-decoration'

TextDecoration.page = {
    layout: CssDoc,
    title: 'Text Decoration',
    description: 'The text-decoration CSS shorthand property  sets the appearance of decorative lines on text.',
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
