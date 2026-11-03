import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function AnimationTimingFunction() {

    return (
        <>
            <ClassTable names={[
                ['animation-timing-function:`function`,`…`', '@easing:`function`,`…`'],
                ['@easing:ease'],
                ['@easing:ease-in'],
                ['@easing:ease-out'],
                ['@easing:linear'],
                ['@easing:step-start'],
                ['@easing:step-end'],
                ['@easing:steps(`stop`,`direction`)'],
                ['@easing:frames(`value`)'],
                ['@easing:cubic-bezier(`value`,`value`,`value`,`value`)'],
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>animation-timing-function</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a>&nbsp;
                property sets how an animation progresses through the duration of each cycle.
            </p>
            <StyleEditor
                className="@easing:ease"
                names={[
                    '@easing:ease',
                    '@easing:ease-in',
                    '@easing:ease-out',
                    '@easing:ease-in-out',
                    '@easing:linear',
                    '@easing:step-start',
                    '@easing:step-end',
                    '@easing:steps(6,end)',
                    '@easing:frames(10)',
                    '@easing:cubic-bezier(1,1,1,1)'
                ]}
                renderHtml={(className: string) => `
                <div class="@name:demo:hover>div ..w:100! h:100! bg:blue-60/.2 rounded flex align-items:center..">
                    <div class="
                        rel 
                        @iteration-count:infinite 
                        @duration:.75s
                        **${className}** 
                        ..p:12|15 block f:14 w:100! h:100! rounded cursor:pointer b:5|solid|blue-60 bg:blue-60/.2..">
                    </div>
                </div>
                `}
            >
            </StyleEditor>
            <StyleFunctions name="@easing:$(function)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="@easing:ease:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="@easing:ease@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="@easing:ease@print"></StyleMediaQueries>
            <StyleColorSchemes name="@easing:ease@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.animation-timing-function'

AnimationTimingFunction.page = {
    layout: CssDoc,
    title: 'Animation Timing Function',
    description: 'The animation-timing-function CSS  property sets how an animation progresses through the duration of each cycle.',
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

