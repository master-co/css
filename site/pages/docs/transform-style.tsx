import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function TransformStyle() {


    return (
        <>
            <ClassTable names={[
                ['transform-style:`value`'],
                ['transform:flat'],
                ['transform:preserve-3d']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>transform-style</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a>&nbsp;
                property sets whether children of an element are positioned in the 3D space or are flattened in the plane of the element.
            </p>
            <StyleEditor
                autofocus
                tag="div"
                className="transform:preserve-3d"
                names={[
                    'transform:preserve-3d',
                    'transform:flat'
                ]}
                renderHtml={(className: string) => `
                    <div class="**${className}**
                        transform:perspective(25rem)|rotateX(-25deg)|rotateY(-15deg) ..w:100 h:100 rel {w:full;h:full}>div>img {w:full;h:full;abs}>div m:20 p:0!..">
                        <div class="transform:translateZ(50px)">
                            <img class="opacity:.5 bg:gray-50|url('/images/wallpaper.jpg')|no-repeat|top|left/cover aspect:1/1"/>
                        </div>
                        <div class="transform:rotateY(180deg)|translateZ(50px)">
                            <img/>
                        </div>
                        <div class="transform:rotateY(90deg)|translateZ(50px)">
                            <img/>
                        </div>
                        <div class="transform:rotateY(-90deg)|translateZ(50px)">
                            <img/>
                        </div>
                        <div class="transform:rotateX(90deg)|translateZ(50px)">
                            <img/>
                        </div>
                        <div class="transform:rotateX(-90deg)|translateZ(50px)">
                            <img/>
                        </div>
                    </div>
                `} />
            <StyleFunctions name="transform-style:$(box)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="transform-style:flat:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="transform-style:flat@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="transform-style:flat@print"></StyleMediaQueries>
            <StyleColorSchemes name="transform-style:flat@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.transform-style'

TransformStyle.page = {
    layout: CssDoc,
    title: 'Transform Style',
    description: 'The transform-style CSS  property sets whether children of an element are positioned in the 3D space or are flattened in the plane of the element.',
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
