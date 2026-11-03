import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function TransformBox() {

    return (
        <>
            <ClassTable names={[
                ['transform-box:`box`'],
                ['transform:content'],
                ['transform:border'],
                ['transform:fill'],
                ['transform:stroke'],
                ['transform:view'],
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>transform-box</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a>&nbsp;
                property defines the layout box to which the&nbsp;
                <a href="transform">transform</a> and <a href="transform-origin">transform-origin</a> properties relate.
            </p>
            <StyleFunctions name="transform-box:$(box)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="transform-box:content-box:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="transform-box:content-box@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="transform-box:content-box@print"></StyleMediaQueries>
            <StyleColorSchemes name="transform-box:content-box@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.transform-box'

TransformBox.page = {
    layout: CssDoc,
    title: 'Transform Box',
    description: 'The transform-box CSS  property defines the layout box to which the transform and transform-origin properties relate.',
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