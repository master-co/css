import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import ShorthandList from '~/components/Css/ShorthandList'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function Background() {

    return (
        <>
            <ClassTable names={[
                ['background:`param`', 'bg:`param`'],
                ['background:`param`,`…`', 'bg:`param`,`…`']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>background</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/Shorthand_properties" target="blank">shorthand property</a>&nbsp;
                sets all background style properties at once, 
                It is a shorthand for:
            </p>
            <ShorthandList items={[
                'background-attachment',
                'background-blend-mode',
                'background-clip',
                'background-color',
                'background-image',
                'background-origin',
                'background-position',
                'background-repeat',
                'background-size'
            ]}>
            </ShorthandList>
            <StyleFunctions name="bg:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="bg:url('…');center/cover:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="bg:url('…');center/cover@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="bg:url('…');center/cover@print"></StyleMediaQueries>
            <StyleColorSchemes name="bg:url('…');center/cover@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.background'

Background.page = {
    layout: CssDoc,
    title: 'Background',
    description: 'The background CSS shorthand property  sets all background style properties at once.',
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
