import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function TransformOrigin() {


    return (
        <>
            <ClassTable names={[
                ['transform-origin:`value`'],
                ['transform:`offset-x`|`offset-y`'],
                ['transform:`offset-x`|`offset-y`|`offset-z`'],
                ['transform:top'],
                ['transform:bottom'],
                ['transform:right'],
                ['transform:left'],
                ['transform:center']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>transform-origin</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a>&nbsp;
                property sets the origin for an element&rsquo;s transformations.
            </p>
            <StyleFunctions name="transform-origin:$(box)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="transform-origin:content-box:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="transform-origin:content-box@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="transform-origin:content-box@print"></StyleMediaQueries>
            <StyleColorSchemes name="transform-origin:content-box@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.transform-origin'

TransformOrigin.page = {
    layout: CssDoc,
    title: 'Transform Origin',
    description: 'The transform-origin CSS  property sets the origin for an element’s transformations.',
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
};