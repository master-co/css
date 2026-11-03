import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function Isolation() {

    return (
        <>
            <ClassTable names={[
                ['isolation:`value`'],
                ['isolation:auto'],
                ['isolate']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>isolation</code></strong>&nbsp;<a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property determines 
                whether an element must create a new <a href="https://developer.mozilla.org/en-US/docs/Glossary/Stacking_context" target="blank">stacking context</a>.
            </p>
            <StyleEditor
                tag="div"
                className="isolation:$(value)"
                renderHtml={() => `
                    <div class="grid-cols:2! ..justify-content:start! gap:20..">
                        <div class="..flex flex:col w:full align-items:center..">
                            <code class="f:12 mb:10">isolation:auto</code>
                                <div class="bg:blue-98 bg:gray-10@dark b:1px|solid|gray-10@dark r:8 p:30">
                                    <div class="**isolation:auto** flex justify-content:center">
                                        <img class="blend:color-burn ..round w:68.75% aspect:1/1.." src="/images/wallpaper.jpg" >
                                    </div>
                                </div>
                        </div>
                        <div class="..flex flex:col w:full align-items:center..">
                            <code class="f:12 mb:10">isolate</code>
                                <div class="bg:blue-98 bg:gray-10@dark b:1px|solid|gray-10@dark r:8 p:30">
                                    <div class="**isolation:isolate** flex justify-content:center">
                                        <img class="blend:color-burn ..round w:68.75% aspect:1/1.." src="/images/wallpaper.jpg">
                                    </div>
                                </div>
                        </div>
                    </div>
                `} />
            <StyleFunctions name="isolation:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="isolation:auto:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="isolation:auto@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="isolation:auto@print"></StyleMediaQueries>
            <StyleColorSchemes name="isolation:auto@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.isolation'


Isolation.page = {
    layout: CssDoc,
    title: 'Isolation',
    description: 'The isolation CSS property determines whether an element must create a new stacking context.',
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

