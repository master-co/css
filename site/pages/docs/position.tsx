import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function Position() {

    return (
        <>
            <ClassTable names={[
                ['position:`type`'],
                ['rel'],
                ['abs'],
                ['static'],
                ['fixed'],
                ['sticky']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>position</code></strong>&nbsp;<a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property sets 
                how an element is positioned in a document. The&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/top" target="blank">top</a>,&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/right" target="blank">right</a>,&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/bottom" target="blank">bottom</a>, and&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/left" target="blank">left</a>,&nbsp;
                properties determine the final location of positioned elements.
            </p>
            <StyleEditor
                tag="div"
                className="static"
                names={[
                    'static',
                    'rel',
                    'abs',
                    'fixed',
                    'sticky'
                ]}
                renderHtml={(className: string) => `
                    <div class="..m:30 p:30 max-w:480 bx:1|solid|fade-13/.5 b:0@dark bg:fade-90 bg:gray-20@dark..${className == 'abs' ? ' rel' : ''}${className == 'sticky' ? ' max-h:150 overflow:auto overscroll-behavior:contain' : ''}">
                        <div class="**${className === 'sticky' ? 'sticky top:0' : className}** ..stripe-bg..">
                            <div class="${className === 'sticky' ? '' : '**'+className+' top:10 left:30**'} px:15 box focus">
                                <code class="f:12 f:white! block">
                                    ${className}
                                </code>
                            </div>
                        </div>
                        <p class="..{float:left;font:50;font:semibold}:first-letter my:0 pt:15..">
                            Ladies and gentlemen, the first Virtual CSS came to the world. It will crush all CSS and UI libraries,
                            and subvert your understanding of traditional CSS technology.
                            Keep up with the latest technological trends,
                            he will greatly improve Web interaction and execution efficiency.
                        </p>
                    </div>
                `}
                />
            <StyleFunctions name="position:$(type)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="position:static:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="position:static@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="position:static@print"></StyleMediaQueries>
            <StyleColorSchemes name="position:static@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.position'

Position.page = {
    layout: CssDoc,
    title: 'Position',
    description: 'The position CSS property sets how an element is positioned in a document. The top, right, bottom, and left,  properties determine the final location of positioned elements.',
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
