import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'
import ImageList from '~/components/Css/ImageList'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'


export default function BackgroundOrigin() {

    return (
        <>
            <ClassTable names={[
                    ['background-origin:`origin`'],
                    ['bg:border'],
                    ['bg:content'],
                    ['bg:padding']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>background-origin</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property
                sets the background&#39;s origin: from the border start, inside the border, or inside the padding.
            </p>
            <ImageList
                imageClass="bg:gray-50|url('/images/wallpaper.jpg')|no-repeat|top|left/cover b:8|double|blue-60"
                showClasses={
                    [
                        'bg:padding',
                        'bg:border',
                        'bg:content'
                    ]}
            >
            </ImageList>
            <StyleFunctions name="background:$(origin)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="background:border:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="background:border@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="background:border@print"></StyleMediaQueries>
            <StyleColorSchemes name="background:border@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.background-origin'

BackgroundOrigin.page = {
    layout: CssDoc,
    title: 'Background Origin',
    description: 'The background-origin CSS property sets the background\'s origin: from the border start, inside the border, or inside the padding.',
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

