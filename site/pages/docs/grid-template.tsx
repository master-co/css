import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import ShorthandList from '~/components/Css/ShorthandList'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function GridTemplate() {

    return (
        <>
            <ClassTable names={[
                ['grid-template:`value`'],
                ['grid-template:`rows`/`columns`'],
                ['grid-template:`areas`|`rows`/`columns`'],
                ['grid-template:none'],
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>grid-template</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property is a&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/Shorthand_properties" target="blank">shorthand property</a>&nbsp;
                for defining:
            </p>
            <ShorthandList items={[
                'grid-template-areas',
                'grid-template-columns',
                'grid-template-rows'
            ]}>
            </ShorthandList>
            <StyleFunctions name="grid-template:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="grid-template:none:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="grid-template:none@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="grid-template:none@print"></StyleMediaQueries>
            <StyleColorSchemes name="grid-template:none@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.grid-template'

GridTemplate.page = {
    layout: CssDoc,
    title: 'Grid Template',
    description: 'The grid-template CSS property is a shorthand property  for defining: grid-template-areas, grid-template-columns and grid-template-rows.',
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

