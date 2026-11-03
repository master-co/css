import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function Margin() {

    return (
        <>
            <ClassTable names={[
                ['margin-top:`size`', 'mt:`size`'],
                ['margin-bottom:`size`', 'mb:`size`'],
                ['margin-left:`size`', 'ml:`size`'],
                ['margin-right:`size`', 'mr:`size`'],
                ['margin:`size`', 'm:`size`'],
                ['margin:`size`|`size`', 'm:`size`|`size`'],
                ['margin:`size`|`size`|`size`', 'm:`size`|`size`|`size`'],
                ['margin:`size`|`size`|`size`|`size`', 'm:`size`|`size`|`size`|`size`'],
                ['mx:`size`'],
                ['my:`size`'],
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>margin</code></strong>&nbsp;<a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property
                shorthand property sets the <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Box_Model/Introduction_to_the_CSS_box_model#margin_area" target="blank">margin area</a>&nbsp;
                on all four sides of an element.
            </p>
            <h2 id="basic-usage">Basic usage</h2>
            <h3 id="all-side">All sides</h3>
            <StyleEditor
                autofocus
                tag="div"
                className="m:auto"
                names={[
                    'm:auto',
                    'm:1.2rem',
                    'm:0',
                    'm:10|20|30|40'
                ]}
                renderHtml={(className: string) => `
                    <div class="flex center-content ..stripe-bg r:5..">
                        <div class="**${className}** w:80 h:80 ..bg:blue-60/.2 r:5 b:5|solid|blue-60..">
                        </div>
                    </div>
                `} />
            <h3 id="single-side">Single sides</h3>
            <p>
                Using <code>mt</code>, <code>mb</code>, <code>ml</code>, <code>mr</code> to set the margin of single side.
            </p>
            <div className="demo">
                <div className="grid-cols:4 grid-cols:4@md gap:24 p:12 r:5">
                    {
                        [
                            ['mt:15','w:80!'],
                            ['ml:15','h:80!'],
                            ['mb:15','w:80!'],
                            ['mr:15','h:80!'],
                        ].map((classesName: string[]) => {
                            return (
                                <>
                                    <div className="t:center center-content full">
                                        <code className="f:12 lh:2.5 t:center">{classesName[0]}</code>
                                        <div key={classesName[0]} className={classesName[1] + ' inline stripe-bg flex m:auto'}>
                                            <div className={classesName[0] + ' w:80 h:80 bg:blue-60/.2 r:5 b:5|solid|blue-60'}>
                                            </div>
                                        </div>
                                    </div>
                                    
                                </>
                            )
                        })
                    }
                </div>
            </div>
            <h3 id="both-side">Both sides</h3>
            <p>
                Using <code>mx</code>, <code>my</code> to set the margin of vertical or horizontal side.
            </p>
            <div className="demo">
                <div className="grid-cols:4 grid-cols:4@md gap:24 p:12 r:5">
                    {
                        [
                            ['mx:15','h:80!'],
                            ['mx:15 my:5',''],
                            ['my:15','w:80!'],
                            ['mx:5 my:15','w:80!'],
                            ['m:0|15','h:80!'],
                            ['m:5|15',''],
                            ['m:15|0','w:80!'],
                            ['m:15|5','w:80!'],
                            
                        ].map((classesName: string[]) => {
                            return (
                                <>
                                    <div className="t:center center-content full">
                                        <code className="f:12 lh:2.5 t:center">{classesName[0]}</code>
                                        <div key={classesName[0]} className={classesName[1] + ' inline stripe-bg flex m:auto'}>
                                            <div className={classesName[0] + ' w:80 h:80 bg:blue-60/.2 r:5 b:5|solid|blue-60'}>
                                            </div>
                                        </div>
                                    </div>
                                    
                                </>
                            )
                        })
                    }
                </div>
            </div>
            <h3 id="units">Units</h3>
            <p>
                Using units &nbsp; 
                <code>px</code>,&nbsp; 
                <code>em</code>,&nbsp; 
                <code>ch</code>,&nbsp; 
                <code>rem</code>,&nbsp; 
                <code>pc</code>,&nbsp; 
                <code>pt</code>,&nbsp; 
                <code>Q</code>,&nbsp; 
                <code>in</code>,&nbsp; 
                <code>cm</code>,&nbsp; 
                <code>mm</code>,&nbsp; 
                <code>vm</code>,&nbsp; 
                <code>vh</code>,&nbsp; 
                <code>vmin</code>,&nbsp; 
                <code>vmax</code>,&nbsp; 
                <code>%</code>&nbsp;
                to set the margin size.
            </p>
            <StyleEditor
                autofocus
                tag="div"
                className="m:16"
                names={[
                    'm:16',
                    'm:16px',
                    'm:16em',
                    'm:16ch',
                    'm:16rem',
                    'm:16pc',
                    'm:16pt',
                    'm:16Q',
                    'm:16in',
                    'm:16cm',
                    'm:16mm',
                    'm:16vm',
                    'm:16vh',
                    'm:16vmin',
                    'm:16vmax',
                    'm:16%'
                ]}
                showCss
                />
            <StyleFunctions name="m:$(size)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="m:10:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="m:10@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="m:10@print"></StyleMediaQueries>
            <StyleColorSchemes name="m:10@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.margin'

Margin.page = {
    layout: CssDoc,
    title: 'Margin',
    description: 'The margin CSS property shorthand property sets the margin area  on all four sides of an element.',
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
