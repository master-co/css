import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function Padding() {

    return (
        <>
            <ClassTable names={[
                ['padding-top:`size`', 'pt:`size`'],
                ['padding-bottom:`size`', 'pb:`size`'],
                ['padding-left:`size`', 'pl:`size`'],
                ['padding-right:`size`', 'pr:`size`'],
                ['padding:`size`', 'p:`size`'],
                ['padding:`size`|`size`', 'p:`size`|`size`'],
                ['padding:`size`|`size`|`size`', 'p:`size`|`size`|`size`'],
                ['padding:`size`|`size`|`size`|`size`', 'p:`size`|`size`|`size`|`size`'],
                ['px:`size`'],
                ['py:`size`'],
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>padding</code></strong>&nbsp;<a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property
                shorthand property sets the <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Box_Model/Introduction_to_the_CSS_box_model#padding_area" target="blank">padding area</a>&nbsp;
                on all four sides of an element.
            </p>
            <h2 id="basic-usage">Basic usage</h2>
            <h3 id="all-side">All sides</h3>
            <StyleEditor
                autofocus
                tag="div"
                className="p:10"
                names={[
                    'p:10',
                    'p:1.2rem',
                    'p:0',
                    'p:10|20|30|40'
                ]}
                renderHtml={(className: string) => `
                    <div class="**${className}** flex center-content ..stripe-bg r:5..">
                        <div class="w:80 h:80 ..bg:blue-60/.2 r:5 b:5|solid|blue-60..">
                        </div>
                    </div>
                `} />
            <h3 id="single-side">Single sides</h3>
            <p>
                Using <code>pt</code>, <code>pb</code>, <code>pl</code>, <code>pr</code> to set the padding of single side.
            </p>
            <div className="demo">
                <div className="grid-cols:4 grid-cols:4@md gap:24 p:12 r:5">
                    {
                        [
                            ['pt:15','w:80!'],
                            ['pl:15','h:80!'],
                            ['pb:15','w:80!'],
                            ['pr:15','h:80!'],
                        ].map((classesName: string[]) => {
                            return (
                                <>
                                    <div className="t:center center-content full">
                                        <code className="f:12 lh:2.5 t:center">{classesName[0]}</code>
                                        <div key={classesName[0]} className={classesName[0] + ' inline stripe-bg flex m:auto ' + classesName[1]}>
                                            <div className="w:80 h:80 bg:blue-60/.2 r:5 b:5|solid|blue-60">
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
                Using <code>px</code>, <code>py</code> to set the padding of vertical or horizontal side.
            </p>
            <div className="demo">
                <div className="grid-cols:4 grid-cols:4@md gap:24 p:12 r:5">
                    {
                        [
                            ['px:15','h:80!'],
                            ['px:15 py:5',''],
                            ['py:15','w:80!'],
                            ['px:5 py:15','w:80!'],
                            ['p:0|15','h:80!'],
                            ['p:5|15',''],
                            ['p:15|0','w:80!'],
                            ['p:15|5','w:80!'],
                            
                        ].map((classesName: string[]) => {
                            return (
                                <>
                                    <div className="t:center center-content full">
                                        <code className="f:12 lh:2.5 t:center">{classesName[0]}</code>
                                        <div key={classesName[0]} className={classesName[0] + ' inline stripe-bg flex m:auto ' + classesName[1]}>
                                            <div className="w:80 h:80 bg:blue-60/.2 r:5 b:5|solid|blue-60">
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
                to set the padding size.
            </p>
            <StyleEditor
                autofocus
                tag="div"
                className="p:16"
                names={[
                    'p:16',
                    'p:16px',
                    'p:16em',
                    'p:16ch',
                    'p:16rem',
                    'p:16pc',
                    'p:16pt',
                    'p:16Q',
                    'p:16in',
                    'p:16cm',
                    'p:16mm',
                    'p:16vm',
                    'p:16vh',
                    'p:16vmin',
                    'p:16vmax',
                    'p:16%'
                ]}
                showCss
                />
            <StyleFunctions name="p:$(size)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="p:10:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="p:10@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="p:10@print"></StyleMediaQueries>
            <StyleColorSchemes name="p:10@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.padding'

Padding.page = {
    layout: CssDoc,
    title: 'Padding',
    description: 'The padding CSS property shorthand property sets the padding area  on all four sides of an element.',
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
