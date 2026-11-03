import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function ZIndex() {

    return (
        <>
            <ClassTable names={[
                ['z-index:`value`', 'z:`value`']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>z-index</code></strong>&nbsp;<a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property sets 
                the z-order of a positioned element and its descendants or flex items. Overlapping elements with a larger z-index cover those with a smaller one.
            </p>
            <StyleEditor
                tag="div"
                className="z:1"
                names={[
                    'z:1',
                    'z:5',
                    'z:20'
                ]}
                renderHtml={(className: string)=> `
                    <div class="rel w:full min-h:150 flex">
                        <div class="z:5 abs left:150 top:0 bottom:0 my:auto ..bg:blue f:white w:1/5 aspect:1/1 flex center-content r:8..">
                            z:1
                        </div>
                        <div class="**${className}** abs inset:0 m:auto ..stripe-bg f:white w:1/4 aspect:1/1 flex center-content b:2px|solid|red-9 r:8..">
                            ${className}
                        </div>
                        <div class="z:10 abs right:150 top:0 bottom:0 my:auto ..bg:blue f:white w:1/5 aspect:1/1 flex center-content r:8..">
                            z:10
                        </div>
                    </div>
                `}
                />
            <StyleFunctions name="z-index:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="z-index:2:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="z-index:2@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="z-index:2@print"></StyleMediaQueries>
            <StyleColorSchemes name="z-index:2@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.z-index'

ZIndex.page = {
    layout: CssDoc,
    title: 'Z Index',
    description: 'The z-index CSS property sets the z-order of a positioned element and its descendants or flex items. Overlapping elements with a larger z-index cover those with a smaller one.',
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

