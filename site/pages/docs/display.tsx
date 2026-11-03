import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

export default function Display() {

    return (
        <>
            <ClassTable names={[
                ['display:`type`', 'd:`type`'],
                ['hidden', 'hide'],
                ['flex'],
                ['grid'],
                ['inline'],
                ['block'],
                ['table'],
                ['contents'],
                ['inline-block'],
                ['inline-flex'],
                ['inline-grid'],
                ['inline-table'],
                ['table-cell'],
                ['table-caption'],
                ['flow-root'],
                ['list-item'],
                ['table-row'],
                ['table-column'],
                ['table-row-group'],
                ['table-column-group'],
                ['table-header-group'],
                ['table-footer-group']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>display</code></strong>&nbsp;<a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property sets
                whether an element is treated as a <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Flow_Layout" target="blank">block or inline element</a> and
                the layout used for its children, such as <strong>flow layout</strong>, <strong>grid</strong> or <strong>flex</strong>.
            </p>
            <h2 id="block-and-inline">Block & Inline</h2>
            <StyleEditor
                autofocus
                tag="div"
                className="block"
                names={[
                    'block',
                    'd:inline',
                    'inline-block'
                ]}
                renderHtml={(className: string) => `
                    <div class="flex ..stripe-bg..">
                        <div class="**${className}** p:20">
                            <code class="..box..">${className}</code>
                        </div>
                        <div class="**${className}** p:20">
                            <code class="..box..">${className}</code>
                        </div>
                        <div class="**${className}** p:20">
                            <code class="..box..">${className}</code>
                        </div>
                    </div>
                `
                }>
            </StyleEditor>
            <h2 id="flex">Flex</h2>
            <p>For more information, visit Flex.</p>
            <StyleEditor
                tag="div"
                className="flex"
                renderHtml={() => `
                    <div class="**flex** gap:10 w:full ..stripe-bg..">
                        <div class="..box.."> 1 </div>
                        <div class="..box.."> 2 </div>
                        <div class="..box.."> 3 </div>
                        <div class="..box.."> 4 </div>
                        <div class="..box.."> 5 </div>
                    </div>
            `}>
            </StyleEditor>
            <h2 id="inline-flex">Inline Flex</h2>
            <StyleEditor
                tag="div"
                className="inline-flex"
                renderHtml={() => `
                    <div class="flex flex:wrap justify-content:center">
                        Ladies and gentlemen, the first Virtual CSS came to the world. It will crush all CSS and UI libraries,
                        and subvert your understanding of traditional CSS technology.
                        <div class="**inline-flex** align-items:center py:10 px:15">
                            <img src="/images/foods/sushi.jpg" class="w:30 h:30 object:cover round mx:10">
                            <p>Sushi</p>
                        </div>
                        <div class="**inline-flex** align-items:center py:10 px:15">
                            <img src="/images/foods/sushi.jpg" class="w:30 h:30 object:cover round mx:10">
                            <p>Sushi</p>
                        </div>
                        <div class="**inline-flex** align-items:center py:10 px:15">
                            <img src="/images/foods/sushi.jpg" class="w:30 h:30 object:cover round mx:10">
                            <p>Sushi</p>
                        </div>
                        Keep up with the latest technological trends,
                        he will greatly improve Web interaction and execution efficiency.
                    </div>
                `}>
            </StyleEditor>
            <h2 id="grid">Grid</h2>
            <p>For more information, visit Grid.</p>
            <StyleEditor
                tag="div"
                className="d:grid"
                renderHtml={() => `
                    <div class="**d:grid** grid-cols:3 ..gap:10 w:full stripe-bg..">
                        <div class="..box.."> 1 </div>
                        <div class="..box.."> 2 </div>
                        <div class="..box.."> 3 </div>
                        <div class="..box.."> 4 </div>
                        <div class="..box.."> 5 </div>
                        <div class="..box.."> 6 </div>
                    </div>
                `}>
            </StyleEditor>
            <StyleFunctions name="display:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="display:block:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="display:block@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="display:block@print"></StyleMediaQueries>
            <StyleColorSchemes name="display:block@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.display'

Display.page = {
    layout: CssDoc,
    title: 'Display',
    description: 'The display CSS property sets whether an element is treated as a block or inline element and the layout used for its children, such as flow layout, grid or flex.',
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
