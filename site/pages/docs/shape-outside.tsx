import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function ShapeOutside() {

    return (
        <>
            <ClassTable names={[
                ['shape-outside:`value`'],
                ['shape-outside:none'],
                ['shape:margin'],
                ['shape:content'],
                ['shape:border'],
                ['shape:padding'],
                ['shape:inset(`…`)'],
                ['shape:circle(`…`)'],
                ['shape:ellipse(`…`)'],
                ['shape:polygon(`…`)'],
                ['shape:url(`…`)'],
                ['shape:linear-gradient(`…`)']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>shape-outside</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property
                defines a shape—which may be non-rectangular—around which adjacent inline content should wrap.
                By default, inline content wraps around its margin box;
                <br />
                <a href="shape-outside">shape-outside</a> provides a way to customize this wrapping, making it possible to wrap text around complex objects rather than simple boxes.
            </p>
            <StyleEditor
                tag="div"
                className="shape-outside:none"
                names={[
                    'shape-outside:none',
                    'shape:inset(0|20px)',
                    'shape:circle(50px|at|60px|90px)',
                    'shape:ellipse(50px|70px|at|60px|90px)',
                    'shape:polygon(70%|0,100%|70%,30%|100%,0|30%)'
                ]}
                renderHtml={(className: string) => `
                <div>
                    <p class="mt:0">
                        The shape-image-threshold CSS property sets the alpha channel threshold used to extract the shape using an image as the value for shape-outside.
                    </p>
                    <div class="**${className}** 
                        **${className.replace('shape', 'clip')}**
                        flex float:left w:240 h:120 
                        bg:url('/images/logo.svg')|no-repeat|top|left/contain
                        **shape-outside:url('/images/logo.svg')**
                        shape-image-threshold:0.5 shape:25">
                    </div>
                    <p class="mt:0">
                        Any pixels whose alpha component's value is greater than the threshold are considered to be part of the shape for the purposes of determining its boundaries.<br>
                        For example, a value of 0.5 means that the shape will enclose all the pixels that are more than 50% opaque.
                    </p>
                </div>
                `} />
            <StyleFunctions name="shape-outside:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="shape-outside:inset(0|20px):hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="shape-outside:inset(0|20px)@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="shape-outside:inset(0|20px)@print"></StyleMediaQueries>
            <StyleColorSchemes name="shape-outside:inset(0|20px)@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.shape-outside'

ShapeOutside.page = {
    layout: CssDoc,
    title: 'Shape Outside',
    description: 'The shape-outside CSS property defines a shape—which may be non-rectangular—around which adjacent inline content should wrap.',
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
