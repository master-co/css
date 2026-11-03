import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'
import ImageList from '~/components/Css/ImageList'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'


export default function MaskImage() {

    return (
        <>
            <ClassTable names={[
                ['mask-image:`image`,`…`']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>mask-image</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property
                sets the image that is used as mask layer for an element. 
                By default this means the alpha channel of the mask image will be multiplied with the alpha channel of the element. 
                This can be controlled with the <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/mask-mode" target="blank">mask-mode</a> property.
            </p>
            <ImageList
                cols="1"
                imageClass="bg:gray-50|url('/images/wallpaper.jpg')|no-repeat|top|left/cover w:full"
                showClasses={
                    [
                        'mask-image:linear-gradient(#000000,transparent)',
                        'mask-image:url(\'/images/master-virtual-css.png\')'
                    ]}
            />
            <StyleFunctions name="mask-image:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="mask-image:url(…):hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="mask-image:url(…)@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="mask-image:url(…)@print"></StyleMediaQueries>
            <StyleColorSchemes name="mask-image:url(…)@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.mask-image'

MaskImage.page = {
    layout: CssDoc,
    title: 'Mask Image',
    description: 'The mask-image CSS property sets the image that is used as mask layer for an element. By default this means the alpha channel of the mask image will be multiplied with the alpha channel of the element. This can be controlled with the mask-mode property.',
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
