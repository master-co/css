import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function ShapeImageThreshold() {

    return (
        <>
            <ClassTable names={[
                ['shape-image-threshold:`value`']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>shape-image-threshold</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property 
                sets the alpha channel threshold used to extract the shape using an image as the value for <a href="shape-outside">shape-outside</a>.
            </p>
            <StyleEditor
                tag="div"
                className="shape-image-threshold:0"
                names={[
                    'shape-image-threshold:0',
                    'shape-image-threshold:0.5',
                    'shape-image-threshold:1'
                ]}
                renderHtml={(className: string) => `
                <div>
                    <p class="mt:0">
                        The shape-image-threshold CSS property sets the alpha channel threshold used to extract the shape using an image as the value for shape-outside.
                    </p>
                    <div class="**${className}** 
                        flex float:left w:240 h:120 
                        bg:url('/images/logo.svg')|no-repeat|top|left/contain
                        **shape-outside:url('/images/logo.svg')**
                        shape:25">
                    </div>
                    <p class="mt:0">
                        Any pixels whose alpha component's value is greater than the threshold are considered to be part of the shape for the purposes of determining its boundaries.<br>
                        For example, a value of 0.5 means that the shape will enclose all the pixels that are more than 50% opaque.
                    </p>
                </div>
                `} />
            <StyleFunctions name="shape-image-threshold:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="shape-image-threshold:0.2:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="shape-image-threshold:0.2@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="shape-image-threshold:0.2@print"></StyleMediaQueries>
            <StyleColorSchemes name="shape-image-threshold:0.2@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.shape-image-threshold'

ShapeImageThreshold.page = {
    layout: CssDoc,
    title: 'Shape Image Threshold',
    description: 'The shape-image-threshold CSS property sets the alpha channel threshold used to extract the shape using an image as the value for shape-outside.',
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