import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function TransitionTimingFunction() {

    return (
        <>
            <ClassTable names={[
                ['transition-timing-function:`function`,`…`','~easing:`function`,`…`'],
                ['~easing:ease'],
                ['~easing:ease-in'],
                ['~easing:ease-out'],
                ['~easing:linear'],
                ['~easing:step-start'],
                ['~easing:step-end'],
                ['~easing:steps(`stop`,`direction`)'],
                ['~easing:frames(`value`)'],
                ['~easing:cubic-bezier(`value`,`value`,`value`,`value`)'],
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>transition-timing-function</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a>&nbsp;
                property sets how intermediate values are calculated for CSS properties being affected by a&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Transitions/Using_CSS_transitions" target="blank">transition effect</a>.
            </p>

            <div className="demo grid-cols:2 grid-cols:2@md gap:12">
            {
                [
                    '~easing:ease',
                    '~easing:ease-in',
                    '~easing:ease-out',
                    '~easing:ease-in-out',
                    '~easing:linear',
                    '~easing:step-start',
                    '~easing:step-end',
                    '~easing:steps(6,end)',
                    '~easing:frames(10)',
                    '~easing:cubic-bezier(1,1,1,1)'
                ].map((className)=> {
                    return (
                        <>
                            <div key={className}  className="t:center center-content full">
                                <code className="f:12 lh:2.5 t:center">{className}</code>
                                <div className="inline flex m:auto">
                                    <div className={className + ' m:auto w:80 h:80 bg:blue-60/.2 r:5 b:5|solid|blue-60 {w:200}:hover ~duration:300ms ~property:all'}>
                                    </div>
                                </div>
                            </div>
                        </>
                    )
                }
                )
            }
            </div>
            <StyleFunctions name="transition-timing-function:$(function)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="transition-timing-function:ease:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="transition-timing-function:ease@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="transition-timing-function:ease@print"></StyleMediaQueries>
            <StyleColorSchemes name="transition-timing-function:ease@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.transition-timing-function'

TransitionTimingFunction.page = {
    layout: CssDoc,
    title: 'Transition Timing Function',
    description: 'The transition-timing-function CSS  property sets how intermediate values are calculated for CSS properties being affected by a transition effect.',
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