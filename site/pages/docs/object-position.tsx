import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function ObjectPosition() {

    return (
        <>
            <ClassTable names={[
                ['object-position:`position`', 'object:`position`', 'obj:`position`'],
                ['object-position:`position`|`position`', 'object:`position`|`position`', 'obj:`position`|`position`'],
                ['obj:top'],
                ['obj:bottom'],
                ['obj:left'],
                ['obj:right'],
                ['obj:center']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>object-position</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property
                specifies the alignment of the selected <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/Replaced_element" target="blank">replaced element</a>&rsquo;s
                contents within the element&rsquo;s box. Areas of the box which aren&rsquo;t covered by the replaced element&rsquo;s object will show the element&rsquo;s background.
            </p>
            <StyleEditor
                tag="div"
                className="object-fit:none object-position:$(value)"
                renderHtml={(className: string) => `
                <div class="p:20!">
                    <div class="grid-cols:3! gap:1 min-w:640 min-h:426">
                        ${[
                            ['object-position:top;left', 'object-position:0%|0%'],
                            ['obj:top', 'object-position:50%|0%'],
                            ['object-position:top;right', 'object-position:100%|0%'],
                            ['obj:left', 'object-position:0%|50%'],
                            ['obj:center', 'object-position:50%|50%'],
                            ['obj:right', 'object-position:100%|50%'],
                            ['object-position:bottom|left', 'object-position:0%|100%'],
                            ['obj:bottom', 'object-position:50%|100%'],
                            ['object-position:bottom|right', 'object-position:100%|100%'],
                        ].map(name => `<div class="flex flex:col w:full align-items:center">
                            <div class="position:relative w:full aspect:640/426 ..block!:hover>div>code..">
                                <img class="abs full object-fit:none **${name[0]}**" src="/images/mountain.jpg">
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
            <StyleFunctions name="object-position:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="object-position:top:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="object-position:top@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="object-position:top@print"></StyleMediaQueries>
            <StyleColorSchemes name="object-position:top@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.object-position'

ObjectPosition.page = {
    layout: CssDoc,
    title: 'Object Position',
    description: 'The object-position CSS property specifies the alignment of the selected replaced element’s contents within the element’s box. Areas of the box which aren’t covered by the replaced element’s object will show the element’s background.',
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
