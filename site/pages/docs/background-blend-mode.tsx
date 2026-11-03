import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'
import ImageList from '~/components/Css/ImageList'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'


export default function BackgroundBlendMode() {


    return (
        <>
            <ClassTable names={[
                    ['background-blend-mode:`mode`'],
                    ['background-blend-mode:normal'],
                    ['background-blend-mode:multiply'],
                    ['background-blend-mode:screen'],
                    ['background-blend-mode:overlay'],
                    ['background-blend-mode:darken'],
                    ['background-blend-mode:lighten'],
                    ['background-blend-mode:color-dodge'],
                    ['background-blend-mode:color-burn'],
                    ['background-blend-mode:hard-light'],
                    ['background-blend-mode:soft-light'],
                    ['background-blend-mode:difference'],
                    ['background-blend-mode:exclusion'],
                    ['background-blend-mode:hue'],
                    ['background-blend-mode:saturation'],
                    ['background-blend-mode:color'],
                    ['background-blend-mode:luminosity']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>background-blend-mode</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property
                sets how an element&#39;s background images should blend with each other and with the element&#39;s background color.
            </p>
            <ImageList
                imageClass="bg:gray-50|url('/images/wallpaper.jpg')|no-repeat|top|left/cover"
                showClasses={
                    [
                        'background-blend-mode:normal',
                        'background-blend-mode:multiply',
                        'background-blend-mode:screen',
                        'background-blend-mode:overlay',
                        'background-blend-mode:darken',
                        'background-blend-mode:lighten',
                        'background-blend-mode:color-dodge',
                        'background-blend-mode:color-burn',
                        'background-blend-mode:hard-light',
                        'background-blend-mode:soft-light',
                        'background-blend-mode:difference',
                        'background-blend-mode:exclusion',
                        'background-blend-mode:hue',
                        'background-blend-mode:saturation',
                        'background-blend-mode:color',
                        'background-blend-mode:luminosity'
                    ]}
            >
            </ImageList>
            <StyleFunctions name="background-blend-mode:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="background-blend-mode:normal:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="background-blend-mode:normal@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="background-blend-mode:normal@print"></StyleMediaQueries>
            <StyleColorSchemes name="background-blend-mode:normal@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.background-blend-mode'

BackgroundBlendMode.page = {
    layout: CssDoc,
    title: 'Background Blend Mode',
    description: 'The background-blend-mode CSS property sets how an element\'s background images should blend with each other and with the element\'s background color.',
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

