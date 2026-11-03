import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'
import ImageList from '~/components/Css/ImageList'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'


export default function Opacity() {

    return (
        <>
            <ClassTable names={[
                ['opacity:`value`']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>opacity</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property
                lets you apply graphical effects such as blurring or color shifting to the area behind an element. 
                Because it applies to everything behind the element, to see the effect you must make the element or its background at least partially transparent.
            </p>
            <ImageList
                imageClass="bg:gray-50|url('/images/wallpaper.jpg')|no-repeat|top|left/cover"
                showClasses={
                    [
                        'opacity:0',
                        'opacity:0.2',
                        'opacity:0.4',
                        'opacity:0.6',
                        'opacity:0.8',
                        'opacity:1',
                    ]}
                showCover="true"
            />
            <StyleFunctions name="opacity:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="opacity:.5:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="opacity:.5@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="opacity:.5@print"></StyleMediaQueries>
            <StyleColorSchemes name="opacity:.5@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.opacity'

Opacity.page = {
    layout: CssDoc,
    title: 'Opacity',
    description: 'The opacity CSS property lets you apply graphical effects such as blurring or color shifting to the area behind an element. Because it applies to everything behind the element, to see the effect you must make the element or its background at least partially transparent.',
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
