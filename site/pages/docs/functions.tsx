import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Code from '~/components/Code'
import CodeHTML2CSS from '~/components/Code/CodeHTML2CSS';
import ReferenceTable from '~/components/Css/ReferenceTable'
import ShorthandList from '~/components/Css/ShorthandList';
import CssDoc from '~/layouts/CssDoc'

export default function Functions() {

    return (
        <>
            <p>
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Functions" target="blank">CSS Functional Notation</a> is
                a type of CSS value that can represent more complex data types or invoke special data processing or calculations.
            </p>

            <h2 id="reference-functions">Reference functions</h2>
            <p>
                The following functions are used as a value of properties to reference a value defined elsewhere.
            </p>
            <ReferenceTable
                title="function"
                subtitle="description"
                names={[
                    { name: 'attr()', description: 'Used to retrieve the value of an attribute of the selected element and use it in the stylesheet.', mdn: 'attr' },
                    { name: 'env()', description: 'Used to insert the value of a user agent-defined environment variable.', mdn: 'env' },
                    { name: 'url()', description: 'Used to include a file.', mdn: 'url' },
                    { name: 'var()', description: 'Used to insert a value of a custom property instead of any part of a value of another property.', mdn: 'var' },
                ]}>
            </ReferenceTable>
            <h3 id="env">env()</h3>
            <p>
                The <code>env()</code> can be used to insert the value of a user agent-defined environment variable into your CSS,
                in a similar fashion to the <code>var()</code> function and custom properties.
            </p>
            <ReferenceTable
                title="function"
                subtitle="description"
                names={[
                    { name: 'env(safe-area-inset-top)', description: 'The top insets from the edge of the viewport.', hiddenRef: true },
                    { name: 'env(safe-area-inset-bottom)', description: 'The bottom insets from the edge of the viewport.', hiddenRef: true },
                    { name: 'env(safe-area-inset-left)', description: 'The left insets from the edge of the viewport.', hiddenRef: true },
                    { name: 'env(safe-area-inset-right)', description: ' The right insets from the edge of the viewport.', hiddenRef: true },
                ]}>
            </ReferenceTable>
            <br />
            <CodeHTML2CSS>
                {`
                    <div class="pt:calc(env(safe-area-inset-top)+0.5rem)">...</div>
                `}
            </CodeHTML2CSS>


            <h3 id="var">var()</h3>
            <p>
                Define your variables in CSS file or <code>&lt;style&gt;</code>, access the variable via <code>$(var)</code>.
            </p>
            <Code lang="css" name="main.css">
                {`
                    :root {
                        --demo-skew: skewX(30deg);
                    }
                `}
            </Code>
            <Code lang="html" name="index.html">
                {`
                   <img class="transform:$(demo-skew)"></img>
                `}
            </Code>


            <h2 id="transform-functions">Transform functions</h2>
            <p>
                Master document of transform function: <a href="transform">Transform</a>.
            </p>
            <ReferenceTable
                noScroll
                title="function"
                subtitle="description"
                names={[
                    { name: 'translate(`x`,`y`)', description: 'Translates an element horizontally.' },
                    { name: 'translate3d(`x`,`y`,`z`)', description: 'Translates an element in 3D space.' },
                    { name: 'translateX(`x`)', description: 'Translates an element horizontally.' },
                    { name: 'translateY(`y`)', description: 'Translates an element vertically.' },
                    { name: 'translateZ(`z`)', description: 'Translates an element along the z-axis.' },
                    { name: 'scale(`x`,`y`)', description: 'Scales an element up or down on the 2D plane.' },
                    { name: 'scale3d(`x`,`y`,`z`)', description: 'Scales an element up or down in 3D space.' },
                    { name: 'scaleX(`x`)', description: 'Scales an element up or down horizontally.' },
                    { name: 'scaleY(`y`)', description: 'Scales an element up or down vertically.' },
                    { name: 'scaleZ(`z`)', description: 'Scales an element up or down along the z-axis.' },
                    { name: 'skew(`x`,`y`)', description: 'Skews an element on the 2D plane.' },
                    { name: 'skewX(`x`)', description: 'Skews an element in the horizontal direction.' },
                    { name: 'skewY(`y`)', description: 'Skews an element in the vertical direction.' },
                    { name: 'rotate(`angle`)', description: 'Rotates an element around a fixed point on the 2D plane.' },
                    { name: 'rotate3d(`x`,`y`,`z`,`angle`)', description: 'Rotates an element around a fixed axis in 3D space.' },
                    { name: 'rotateX(`x`)', description: 'Rotates an element around the horizontal axis.' },
                    { name: 'rotateY(`y`)', description: 'Rotates an element around the vertical axis.' },
                    { name: 'rotateZ(`z`)', description: 'Rotates an element around the z-axis.' },
                    { name: 'perspective()', description: 'Sets the distance between the user and the z=0 plane.' },
                    { name: 'matrix()', description: 'Describes a homogeneous 2D transformation matrix.' },
                    { name: 'matrix3d()', description: 'Describes a 3D transformation as a 4×4 homogeneous matrix.' }
                ]}>
            </ReferenceTable>

            <h2 id="math-functions">Math functions</h2>
            <p>
                The math functions allow CSS numeric values to be written as mathematical expressions.
            </p>
            <ReferenceTable
                noScroll
                title="function"
                subtitle="description"
                names={[
                    { name: 'calc()', description: 'A math function that allows basic arithmetic to be performed on numerical CSS values.' },
                    { name: 'clamp()', description: 'A comparison function that takes a minimum, central, and maximum value and represents its central calculation.' },
                    { name: 'max()', description: 'A comparison function that represents the largest of a list of values.' },
                    { name: 'min()', description: 'A comparison function that represents the smallest of a list of values.' }
                ]}>
            </ReferenceTable>

            <h2 id="filter-functions">Filter functions</h2>
            <p>
                Master document of filter function: <a href="filter">Filter</a>, <a href="backdrop-filter">Backdrop Filter</a>.
            </p>
            <ReferenceTable
                noScroll
                title="function"
                subtitle="description"
                names={[
                    { name: 'blur()', description: 'Blurs the image.' },
                    { name: 'brightness()', description: 'Makes the image brighter or darker.' },
                    { name: 'contrast()', description: 'Increases or decreases the image\'s contrast.' },
                    { name: 'drop-shadow()', description: 'Applies a drop shadow behind the image.' },
                    { name: 'grayscale()', description: 'Converts the image to grayscale.' },
                    { name: 'hue-rotate()', description: 'Changes the overall hue of the image.' },
                    { name: 'invert()', description: 'Inverts the colors of the image.' },
                    { name: 'opacity()', description: 'Makes the image transparent.' },
                    { name: 'saturate()', description: 'Super-saturates or desaturates the input image.' },
                    { name: 'sepia()', description: 'Converts the image to sepia.' },
                    { name: 'backdrop-filter: `filter-function`', description: 'The backdrop-filter CSS property lets you apply graphical effects such as blurring or color shifting to the area behind an element.', mdn: 'backdrop-filter', caniuse: 'backdrop-filter' }
                ]}>
            </ReferenceTable>

            <h2 id="color-functions">Color functions</h2>
            <p>
                Master includes out-of-the-box color palette consisting of several common colors: <a href="colors">Colors</a>.
            </p>
            <ReferenceTable
                noScroll
                title="function"
                subtitle="description"
                names={[
                    { name: 'rgb()', description: 'The RGB color model defines a given color according to its red, green, and blue components. An optional alpha component represents the color\'s transparency.' },
                    { name: 'rgba()', description: 'The RGB color model defines a given color according to its red, green, and blue components. The alpha component represents the color\'s transparency.' },
                    { name: 'hsl()', description: 'The HSL color model defines a given color according to its hue, saturation, and lightness components. An optional alpha component represents the color\'s transparency.' },
                    { name: 'hsla()', description: 'The HSL color model defines a given color according to its hue, saturation, and lightness components. The alpha component represents the color\'s transparency.' }
                ]}>
            </ReferenceTable>

            <h2 id="image-functions">Image functions</h2>
            <p>
                Master document of Image function: <a href="background-image">Background Image</a>, <a href="list-style-image">List Style Image</a>.
            </p>
            <ReferenceTable
                title="function"
                subtitle="description"
                names={[
                    { name: 'url()', description: 'Defines an <image> in a similar fashion to the url() function.', mdn: 'image', caniuse: 'image()' },
                    { name: 'linear-gradient()', description: 'Linear gradients transition colors progressively along an imaginary line.' },
                    { name: 'radial-gradient()', description: 'Radial gradients transition colors progressively from a center point (origin).' },
                    { name: 'repeating-linear-gradient()', description: 'It repeats the linear-gradient color stops infinitely in all directions so as to cover its entire container.' },
                    { name: 'repeating-radial-gradient()', description: 'It repeats the radial-gradient color stops infinitely in all directions so as to cover its entire container.' },
                    { name: 'conic-gradient()', description: 'Conic gradients transition colors progressively around a circle.' },
                    { name: 'background-image: `image-function`', description: 'Defines a background image.', mdn: 'background-image', caniuse: 'background-image' },
                    { name: 'list-style-image: `image-function`', description: 'Defines a list marker.', mdn: 'list-style-image', caniuse: 'list-style-image' },

                ]}>
            </ReferenceTable>

            <h2 id="counter-functions">Counter functions</h2>
            <p>
                The counter functions are generally used with the content property.
            </p>
            <ReferenceTable
                noScroll
                title="function"
                subtitle="description"
                names={[
                    { name: 'counter()', description: 'Returns a string representing the current value of the named counter, if there is one.' },
                    { name: 'counters()', description: 'Enables nested counters, returning a concatenated string representing the current values of the named counters, if there are any.' },
                ]}>
            </ReferenceTable>

            <h2 id="shape-functions">Shape functions</h2>
            <p>
                Master document of shape function: <a href="clip-path">Clip Path</a>, <a href="shape-outside">Shape Outside</a>.
            </p>
            <ReferenceTable
                noScroll
                title="function"
                subtitle="description"
                names={[
                    { name: 'circle()', description: 'Defines a circle.' },
                    { name: 'ellipse()', description: 'Defines an ellipse.' },
                    { name: 'inset()', description: 'Defines an inset rectangle.' },
                    { name: 'polygon()', description: 'Defines a polygon.' },
                    { name: 'path()', description: 'Accepts an SVG path string to enable a shape to be drawn.' },
                    { name: 'shape-outside: `shape-function`', description: 'The shape-outside CSS property defines a shape—which may be non-rectangular—around which adjacent inline content should wrap.', mdn: 'shape-outside', caniuse: 'shape-outside' },
                    { name: 'clip-path: `shape-function`', description: 'The clip-path CSS property creates a clipping region that sets what part of an element should be shown. Parts that are inside the region are shown, while those outside are hidden.', mdn: 'clip-path', caniuse: 'clip-path' },

                ]}>
            </ReferenceTable>

            <h2 id="grid-functions">Grid functions</h2>
            <p>
                Master document of grid function: <a href="grid">Grid</a>.
            </p>
            <ShorthandList items={[
                'grid-auto-columns',
                'grid-auto-flow',
                'grid-auto-rows',
                'grid-template-areas',
                'grid-template-columns',
                'grid-template-rows'
            ]}>
            </ShorthandList>
        </>
    )
}

const localeNamespace = 'docs.css.functions'

Functions.page = {
    layout: CssDoc,
    title: 'Functions',
    description: 'CSS Functional Notation is a type of CSS value that can represent more complex data types or invoke special data processing or calculations.',
    editors: ['Aron','Lola'],
    localeNamespace
};

export async function getStaticProps({ locale }: any) {
    return {
        props: {
            ...(await serverSideTranslations(locale, ['common', 'css', localeNamespace])),
        },
    };
}

