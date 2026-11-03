import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import ShorthandList from '~/components/Css/ShorthandList'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function ListStyle() {

    return (
        <>
            <ClassTable names={[
                ['list-style:`type`|`position`|`image`']
            ]}>
            </ClassTable>
            <p>
            The list-style property is specified as one, two, or three marks in any order.
If list-style-type and list-style-image are both set, then list-style-type is used as a fallback if the image is unavailable.
            </p>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>list-style</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property 
                allows you to set all the list style properties at once.
                <br/>
                <br/>
                It is a shorthand for:
            </p>
            <ShorthandList items={[
                'list-style-image',
                'list-style-position',
                'list-style-type'
            ]}>
            </ShorthandList>
            <StyleFunctions name="list-style:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="list-style:url(…)|inside:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="list-style:url(…)|inside@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="list-style:url(…)|inside@print"></StyleMediaQueries>
            <StyleColorSchemes name="list-style:url(…)|inside@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.list-style'

ListStyle.page = {
    layout: CssDoc,
    title: 'List Style',
    description: 'The list-style CSS property allows you to set all the list style properties at once.',
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
