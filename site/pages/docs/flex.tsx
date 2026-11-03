import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import ShorthandList from '~/components/Css/ShorthandList'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function Flex() {

    return (
        <>
            <ClassTable names={[
                ['flex:`basis`'],
                ['flex:`grow`'],
                ['flex:`grow`|`basis`'],
                ['flex:`grow`|`shrink`|`basis`']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>flex</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/Shorthand_properties" target="blank">shorthand property</a>&nbsp;
                sets how a flex item will grow or shrink to fit the space available in its flex container. 
                It is a shorthand for:
            </p>
            <ShorthandList items={[
                'flex-grow',
                'flex-shrink',
                'flex-basis'
            ]}>
            </ShorthandList>
            <StyleFunctions name="flex:$(direction)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="flex:0:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="flex:0@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="flex:0@print"></StyleMediaQueries>
            <StyleColorSchemes name="flex:0@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.flex'

Flex.page = {
    layout: CssDoc,
    title: 'Flex',
    description: 'The flex CSS shorthand property  sets how a flex item will grow or shrink to fit the space available in its flex container.',
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

