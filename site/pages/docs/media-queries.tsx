import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Code from '~/components/Code';
import CodeHTML2CSS from '~/components/Code/CodeHTML2CSS';
import BoxList from '~/components/Css/BoxList';
import ReferenceTable from '~/components/Css/ReferenceTable'
import StyleEditor from '~/components/Css/StyleEditor';
import CssDoc from '~/layouts/CssDoc'

export default function MediaQueries() {

    return (
        <>
            <ReferenceTable
                noScroll
                title="class"
                names={[
                    {
                        name: '@all',
                        description: 'Suitable for all devices.',
                        mdn: '@media',
                        caniuse: 'css-mediaqueries'
                    },
                    {
                        name: '@print',
                        description: 'Intended for paged material and documents viewed on a screen in print preview mode.',
                        mdn: '@media',
                        caniuse: 'print%20media'
                    },
                    {
                        name: '@screen',
                        description: 'Intended primarily for screens.',
                        mdn: '@media',
                        caniuse: 'css-mediaqueries'
                    },
                    {
                        name: '@portrait',
                        description: 'The viewport is in a portrait orientation, i.e., the height is greater than or equal to the width.',
                        mdn: '@media/orientation',
                        caniuse: 'orientation'
                    },
                    {
                        name: '@landscape',
                        description: 'The viewport is in a landscape orientation, i.e., the width is greater than the height.',
                        mdn: '@media/orientation',
                        caniuse: 'orientation'
                    },
                    {
                        name: '@motion',
                        description: 'Indicates that user has notified the system that they prefer an interface that removes or replaces the types of motion-based animation that trigger discomfort for those with vestibular motion disorders.',
                        mdn: '@media/prefers-reduced-motion',
                        caniuse: 'CSS%20%40reduced-motion'
                    },
                    {
                        name: '@reduced-motion',
                        description: 'Indicates that user has notified the system that they prefer an interface that removes or replaces the types of motion-based animation that trigger discomfort for those with vestibular motion disorders.',
                        mdn: '@media/prefers-reduced-motion',
                        caniuse: 'CSS%20%40reduced-motion'
                    },
                    {
                        name: '@media(any-hover:hover)',
                        description: 'Test whether any available input mechanism can hover over elements.',
                        mdn: '@media/any-hover',
                        caniuse: 'CSS%20any-hover'
                    },
                    {
                        name: '@media(any-pointer:coarse)',
                        description: 'At least one input mechanism includes a pointing device of limited accuracy.',
                        mdn: '@media/any-pointer',
                        caniuse: 'CSS%20any-pointer'
                    },
                    {
                        name: '@media(any-pointer:fine)',
                        description: 'At least one input mechanism includes an accurate pointing device.',
                        mdn: '@media/any-pointer',
                        caniuse: 'CSS%20any-pointer'
                    },
                    {
                        name: '@media(hover:hover)',
                        description: `Test whether the user's primary input mechanism can hover over elements.`,
                        mdn: '@media/any-pointer',
                        caniuse: 'CSS%20any-pointer'
                    },
                    {
                        name: '@media(pointer:coarse)',
                        description: `The primary input mechanism includes a pointing device of limited accuracy.`,
                        mdn: '@media/pointer',
                        caniuse: 'CSS%20%40media%20pointer'
                    },
                    {
                        name: '@media(pointer:fine)',
                        description: `The primary input mechanism includes an accurate pointing device.`,
                        mdn: '@media/pointer',
                        caniuse: 'CSS%20%40media%20pointer'
                    },
                    {
                        name: '@media(aspect-ratio:1/1)',
                        description: `Test the aspect ratio of the viewport. 1/1 is an arbitrary value.`,
                        mdn: '@media/aspect-ratio',
                        caniuse: 'CSS%20media%20aspect-ratio'
                    },
                    {
                        name: '@media(color)',
                        description: `Test the number of bits per color component (red, green, blue) of the output device.`,
                        mdn: '@media/color',
                        caniuse: 'CSS%20media%20color'
                    },
                    {
                        name: '@media(display-mode:fullscreen)',
                        description: `All of the available display area is used and no user agent chrome is shown.`,
                        mdn: '@media/display-mode',
                        caniuse: 'CSS%20media%20display-mode'
                    },
                    {
                        name: '@media(display-mode:standalone)',
                        description: `The application will look and feel like a standalone application.`,
                        mdn: '@media/display-mode',
                        caniuse: 'CSS%20media%20display-mode'
                    },
                    {
                        name: '@media(display-mode:minimal-ui)',
                        description: `The application will look and feel like a standalone application, but will have a minimal set of UI elements for controlling navigation.`,
                        mdn: '@media/display-mode',
                        caniuse: 'CSS%20media%20display-mode'
                    },
                    {
                        name: '@media(display-mode:browser)',
                        description: `The application opens in a conventional browser tab or new window, depending on the browser and platform.`,
                        mdn: '@media/display-mode',
                        caniuse: 'CSS%20media%20display-mode'
                    },
                    {
                        name: '@media(grid:`value`)',
                        description: `Test whether the output device uses a grid-based screen. value is an arbitrary value.`,
                        mdn: '@media/grid',
                        caniuse: 'CSS%20media%20grid'
                    },
                    {
                        name: '@media(height:`size`)',
                        description: `Apply styles based on the height of the viewport. size is an arbitrary value.`,
                        mdn: '@media/height',
                        caniuse: 'CSS%20media%20height'
                    },
                    {
                        name: '@media(max-height:`size`)',
                        description: `Apply styles based on the max height of the viewport. size is an arbitrary value.`,
                        mdn: '@media/height',
                        caniuse: 'CSS%20media%20height'
                    },
                    {
                        name: '@media(min-height:`size`)',
                        description: `Apply styles based on the min height of the viewport. size is an arbitrary value.`,
                        mdn: '@media/height',
                        caniuse: 'CSS%20media%20height'
                    },
                    {
                        name: '@media(width:`size`)',
                        description: `Apply styles based on the width of the viewport. size is an arbitrary value.`,
                        mdn: '@media/width',
                        caniuse: 'CSS%20media%width'
                    },
                    {
                        name: '@media(max-width:`size`)',
                        description: `Apply styles based on the max width of the viewport. size is an arbitrary value.`,
                        mdn: '@media/width',
                        caniuse: 'CSS%20media%width'
                    },
                    {
                        name: '@media(min-width:`size`)',
                        description: `Apply styles based on the min width of the viewport. size is an arbitrary value.`,
                        mdn: '@media/width',
                        caniuse: 'CSS%20media%width'
                    },
                    {
                        name: '@media(monochrome)',
                        description: `Test the number of bits per pixel in the monochrome frame buffer of the output device.`,
                        mdn: '@media/monochrome',
                        caniuse: 'CSS%20%40media%20monochrome'
                    },
                    {
                        name: '@media(prefers-color-scheme:light)',
                        description: `Indicates that user has notified that they prefer an interface that has a light theme, or has not expressed an active preference.`,
                        mdn: '@media/prefers-color-scheme',
                        caniuse: 'CSS%20%40media%20prefers-color-scheme'
                    },
                    {
                        name: '@media(prefers-color-scheme:dark)',
                        description: `Indicates that user has notified that they prefer an interface that has a dark theme.`,
                        mdn: '@media/prefers-color-scheme',
                        caniuse: 'CSS%20%40media%20prefers-color-scheme'
                    },
                    {
                        name: '@media(prefers-reduced-motion)',
                        description: `Indicates that user has notified the system that they prefer an interface that removes or replaces the types of motion-based animation that trigger discomfort for those with vestibular motion disorders.`,
                        mdn: '@media/prefers-reduced-motion',
                        caniuse: 'CSS%20%40media%20prefers-reduced-motion'
                    },

                ]}>
            </ReferenceTable>

            <h2 id="Overview">Overview</h2>
            <p>
                You may want to display screen with special devices,
                such as printers or audio-based screen readers.
                Master uses an intelligent matching algorithm to make <b>all styles support CSS media queries</b>.
            </p>

            <h2 id="basic-usage">Basic usage</h2>
            <h3 id="print-format">Print Format</h3>
            <p>
                Let your page is stylized for print layout.
            </p>
            <CodeHTML2CSS>
                {`
                    <div class="hide**@print**">Hide on print mode</div>
                `}
            </CodeHTML2CSS>

            <h3 id="orientation">Orientation</h3>
            <ul>
                <li>
                    Set image <code>aspect-ratio:2/1</code> in landscape (horizontal)
                </li>
                <li>
                    Set image <code>aspect-ratio:1/1</code> in landscape (vertical)
                </li>
            </ul>
            <CodeHTML2CSS>
                {`
                    <div class="aspect:2/1**@landscape** aspect:1/1**@portrait**"></div>
                `}
            </CodeHTML2CSS>

            <h3 id="motion-preference">Motion Prefernce</h3>
            <p>
                <b>It will be automatically detected, don&rsquo;t use this on the classes.</b>
                <br />
                <br />
                Animations effect work on <code>@motion</code> preferences by default.
                If the user requested that the system minimize the amount of non-essential motion it uses,
                it will work like <code>@reduced-motion</code>.
            </p>
            <StyleEditor
                tag="div"
                className="@jump|1s|infinite@motion"
                hideHtml
                renderHtml={(className: string) => `
                    <div class="..grid-cols:2 gap:5 w:full h:200..">
                        <div class="@jump|1s|infinite@motion f:12! w:100 h:100 m:auto bg:blue-60/.2 r:5 b:5|solid|blue-60 d:inline-flex">
                            <code class="t:center m:auto">@motion</code>
                        </div>
                        <div class="@jump|1s|infinite@reduced-motion f:12! w:100 h:100 m:auto bg:blue-60/.2 r:5 b:5|solid|blue-60 d:inline-flex">
                            <code class="t:center m:auto">@reduced-motion</code>

                        </div>
                    </div>
                `} />
            <h2 id="colr-scheme-preference">Color Scheme Preference</h2>
            <p>
                For better user experience, most APPs provide color schemes switching in personal settings or pages.
                However, it&rsquo;s impossible to override the user&rsquo;s preferred color schemes through js,
                and it is impossible for developers to implement pure CSS through <code>prefers-color-scheme:dark</code>.
                <br />
                Therefore, Master provides you with a solution.
                <br />
                <br />
                See <a href="color-schemes">Color Schemes</a> documentation for learning more.
            </p>

            <h2 id="responsive-breakpoints">Responsive breakpoints</h2>
            <p>
                Master provides a systematic breakpoints API for you to implement responsive breakpoints using standard media queries like <code>font:24@media(min-width:1024px)</code>.
                <br />
                <br />
                See <a href="breakpoints">Breakpoints</a> documentation for learning more.
            </p>
        </>
    )
}

const localeNamespace = 'docs.css.media-queries'

MediaQueries.page = {
    layout: CssDoc,
    title: 'Media Queries',
    description: 'You may want to display screen with special devices, such as printers or audio-based screen readers. Master uses an intelligent matching algorithm to make all styles support CSS media queries.',
    editors: ['Aron','Lola'],
    localeNamespace,
    mdn: '@media',
    canIUse: '@media'
};

export async function getStaticProps({ locale }: any) {
    return {
        props: {
            ...(await serverSideTranslations(locale, ['common', 'css', localeNamespace])),
        },
    };
}
