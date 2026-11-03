import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'
import ImageList from '~/components/Css/ImageList'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'


export default function Filter() {

    return (
        <>
            <ClassTable names={[
                ['filter:`value`|`value`|`…`'],
                ['filter:none'],
                ['filter:url(`svg`)'],
                ['blur(`value`)'],
                ['brightness(`value`)'],
                ['contrast(`value`)'],
                ['grayscale(`value`)'],
                ['hue-rotate(`degree`)'],
                ['invert(`value`)'],
                ['sepia(`value`)'],
                ['saturate(`value`)'],
                ['opacity(`value`)'],
                ['drop-shadow(`offset-x`|`offset-y`|`blur-radius`|`color`)']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>filter</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property
                applies graphical effects like blur or color shift to an element.
                Filters are commonly used to adjust the rendering of images, backgrounds, and borders.
            </p>
            <ImageList
                imageClass="bg:gray-50|url('/images/wallpaper.jpg')|no-repeat|top|left/cover"
                showClasses={
                    [
                        'invert(0)',
                        'invert(1)',
                        'grayscale(1)',
                        'blur(`value`px)',
                        'brightness(`value`%)',
                        'contrast(`value`%)',
                        'hue-rotate(`value`deg)',
                        'sepia(`value`%)',
                        'saturate(`value`%)',
                        'opacity(`value`%)'
                    ]}
            />
            <StyleFunctions name="filter:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="filter:none:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="filter:none@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="filter:none@print"></StyleMediaQueries>
            <StyleColorSchemes name="filter:none@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.filter'

Filter.page = {
    layout: CssDoc,
    title: 'Filter',
    description: 'The filter CSS property applies graphical effects like blur or color shift to an element. Filters are commonly used to adjust the rendering of images, backgrounds, and borders.',
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
