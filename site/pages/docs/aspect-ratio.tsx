import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function AspectRatio() {

    return (
        <>
            <ClassTable names={[
                  ['aspect-ratio:`ratio`', 'aspect:`ratio`'],
                  ['square'],
                  ['video']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>aspect-ratio</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property 
                sets a <strong>preferred aspect ratio</strong> for the box, 
                which will be used in the calculation of auto sizes and some other layout functions.
            </p>
            <StyleEditor
                tag="div"
                className="aspect:4/3"
                names={[
                    'aspect:4/3',
                    'aspect:16/9',
                    'aspect:1/1'
                ]}
                renderHtml={(className: string) => `
                    <div class="**${className}** ..b:3|solid|blue-60 bg:blue-60/.1 w:100 p:20 flex center-content f:14..">
                        ${className.replace('aspect:','')}
                    </div>
                `} />
            <h2 id="basic-usage">Basic usage</h2>
            <h3 id="embedding-a-video">Embedding a video</h3>
            <StyleEditor
                tag="iframe"
                className="video"
                names={[
                    'video',
                    'aspect:16/9',
                    'aspect:4/3',
                    'aspect:1/1'
                ]}
                renderHtml={(className: string) => `
                    <iframe class="**${className}** w:full"
                         src="https://www.youtube.com/embed/1-xGerv5FOk"
                         title="YouTube video player" 
                         frameborder="0" 
                         allowfullscreen
                         allow="
                            accelerometer; 
                            autoplay; 
                            clipboard-write; 
                            encrypted-media; 
                            gyroscope; 
                            picture-in-picture">
                    </iframe>
                `} />
            <p>
                In most cases, the aspect ratio is usually set with <code>w:full</code>.
            </p>
            <h3 id="embedding-a-video">Same aspect ratio grids</h3>
            <StyleEditor
                tag="iframe"
                className="aspect:1/1"
                names={[
                    'aspect:1/1',
                    'aspect:1/2',
                    'aspect:5/3'
                ]}
                renderHtml={(className: string) => `
                    <div class="grid-cols:3 gap:10">
                    ${
                        [1,2,3].map(e=> `
                        <div class="**${className}** ..b:3|solid|blue-60 bg:blue-60/.1 w:100 p:20 flex center-content f:14..">${className.replace('aspect:','')}</div>`
                        )
                        .join('')
                    }

                    </div>
                   
                `} />
            <StyleFunctions name="aspect:$(ratio)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="aspect:1/1:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="aspect:1/1@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="aspect:1/1@print"></StyleMediaQueries>
            <StyleColorSchemes name="aspect:1/1@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.aspect-ratio'

AspectRatio.page = {
    layout: CssDoc,
    title: 'Aspect Ratio',
    description: 'The aspect-ratio CSS property sets a preferred aspect ratio for the box, which will be used in the calculation of auto sizes and some other layout functions.',
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

