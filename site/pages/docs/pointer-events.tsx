import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function PointerEvents() {

    return (
        <>
            <ClassTable names={[
                  ['pointer-events:`value`'],
                  ['pointer-events:auto'],
                  ['pointer-events:none', 'untouchable'],
                  ['pointer-events:visiblePainted'],
                  ['pointer-events:visibleFill'],
                  ['pointer-events:visibleStroke'],
                  ['pointer-events:visible'],
                  ['pointer-events:painted'],
                  ['pointer-events:fill'],
                  ['pointer-events:stroke'],
                  ['pointer-events:all'],
                  ['pointer-events:bounding-box']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>pointer-events</code></strong>&nbsp;<a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property 
                sets under what circumstances (if any) a particular graphic element can become the <a href="https://developer.mozilla.org/en-US/docs/Web/API/Event/target" target="blank">target</a> of pointer events.
            </p>

            <StyleEditor
                tag="a"
                className="pointer-events:auto"
                names={[
                    'pointer-events:auto',
                    'untouchable',
                    'pointer-events:visiblePainted',
                    'pointer-events:visibleFill',
                    'pointer-events:visibleStroke',
                    'pointer-events:visible',
                    'pointer-events:painted',
                    'pointer-events:fill',
                    'pointer-events:stroke',
                    'pointer-events:all',
                    'pointer-events:bounding-box'
                ]}
                renderHtml={(className: string) => `
                    <div class="..mt:10 gap:5 flex flex:1 stripe-bg p:15..">
                        <a href="#" class="**${className}** m:auto">Example Link</a>
                    </div>
                `} />
            <StyleFunctions name="pointer-events:$(radius)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="pointer-events:auto:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="pointer-events:auto@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="pointer-events:auto@print"></StyleMediaQueries>
            <StyleColorSchemes name="pointer-events:auto@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.pointer-events'

PointerEvents.page = {
    layout: CssDoc,
    title: 'Pointer Events',
    description: 'The pointer-events CSS property sets under what circumstances (if any) a particular graphic element can become the target of pointer events.',
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
}
