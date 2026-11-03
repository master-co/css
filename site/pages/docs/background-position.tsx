import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function BackgroundPosition() {

    return (
        <>
            <ClassTable names={[
                ['background-position:`value`', 'bg:`value`'],
                ['background-position:`x`|`y`'],
                ['background-position:`direction`|`direction`|`value`'],
                ['background-position:`direction`|`value`|`direction`|`value`'],
                ['background-position:`position`,`…`'],
                ['bg:top'],
                ['bg:bottom'],
                ['bg:right'],
                ['bg:left'],
                ['bg:center'],
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>background-position</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property
                sets the initial position for each background image. 
                The position is relative to the position layer set by <a href="background-origin">background-origin</a>.
            </p>
            <StyleEditor
                tag="div"
                className="background-position:$(value)"
                renderHtml={(className: string) => `
                <div class="p:20!">
                    <div class="grid-cols:3! gap:1 min-w:640 min-h:426">
                        ${[
                            ['background:top|left', 'background-position:0%|0%'],
                            ['bg:top', 'background-position:50%|0%'],
                            ['background-position:top|right', 'background-position:100%|0%'],
                            ['bg:left', 'background-position:0%|50%'],
                            ['bg:center', 'background-position:50%|50%'],
                            ['bg:right', 'background-position:100%|50%'],
                            ['background:bottom|left', 'background-position:0%|100%'],
                            ['bg:bottom', 'background-position:50%|100%'],
                            ['background:bottom|right', 'background-position:100%|100%']
                        ].map(name => `<div class="flex flex:col w:full align-items:center">
                            <div class="${name[0]} position:relative w:full aspect:640/426 bg:url('/images/mountain.jpg') bg:no-repeat ..background-size:300%;300% block!:hover>div>code..">
                                <div class="..abs full flex flex:col center-content..">
                                    <code class="..mt:5 w:fit h:fit f:12 f:gray-90! text-shadow:0|0|3|rgba(0,0,0,.6)..">${name[0]}</code>
                                    <code class="..hidden mt:5 w:fit h:fit f:12 f:gray-10! bg:gray-90/.5 r:5 p:3|5..">${name[1]}</code>
                                </div>
                            </div>
                        </div>
                        `).join('')
                        }
                    </div>
                </div>
                `} />
            <StyleFunctions name="background-position:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="background-position:top:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="background-position:top@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="background-position:top@print"></StyleMediaQueries>
            <StyleColorSchemes name="background-position:top@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.background-position'

BackgroundPosition.page = {
    layout: CssDoc,
    title: 'Background Position',
    description: 'The background-position CSS property sets the initial position for each background image. The position is relative to the position layer set by background-origin.',
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

