import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'
import ImageList from '~/components/Css/ImageList'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'


export default function BackgroundSize() {

    return (
        <>
            <ClassTable names={[
                ['background-size:`width`', 'background:`width`', 'bg:`width`'],
                ['background-size:`width`|`height`'],
                ['background-size:`size`,`…`'],
                ['bg:auto'],
                ['bg:cover'],
                ['bg:contain']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>background-size</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property
                sets the size of the element&#39;s background image.
                The image can be left:0 to its natural size, stretched, or constrained to fit the available space.
            </p>
            <ImageList
                imageClass="bg:gray-50|url('/images/mountain.jpg')|no-repeat|top|left"
                showClasses={
                    [
                        'bg:auto',
                        'bg:cover',
                        'bg:contain',
                        'background-size:75%',
                        'background-size:75%|50%'
                    ]}
            />
            <StyleFunctions name="background-size:$(size)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="background-size:10%|20%:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="background-size:10%|20%@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="background-size:10%|20%@print"></StyleMediaQueries>
            <StyleColorSchemes name="background-size:10%|20%@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.background-size'

BackgroundSize.page = {
    layout: CssDoc,
    title: 'Background Size',
    description: 'The background-size CSS property sets the size of the element\'s background image. The image can be left:0 to its natural size, stretched, or constrained to fit the available space.',
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

