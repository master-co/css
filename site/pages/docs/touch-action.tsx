import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'
import ImageList from '~/components/Css/ImageList'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

export default function TouchAction() {

    return (
        <>
            <ClassTable names={[
                ['touch-action:`value`'],
                ['touch-action:auto'],
                ['touch-action:none'],
                ['touch-action:pan-x'],
                ['touch-action:pan-left'],
                ['touch-action:pan-right'],
                ['touch-action:pan-y'],
                ['touch-action:pan-up'],
                ['touch-action:pan-down'],
                ['touch-action:pinch-zoom'],
                ['touch-action:manipulation'],
            ]}>
            </ClassTable>
            <p className="hint">
                Only touch-enabled devices could test this feature.
            </p>
            
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>touch-action</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property
                sets how an element&#39;s region can be manipulated by a touchscreen user (for example, by zooming features built into the browser).
            </p>

            <ImageList
                blockClasses="overflow:auto scrollbar"
                imageClass="bg:gray-50|url('/images/mountain.jpg')|no-repeat|top|left/cover bg:120% min-w:120%"
                showClasses={
                    [
                        'touch-action:auto',
                        'touch-action:none',
                        'touch-action:pinch-zoom',
                        'touch-action:pan-x',
                        'touch-action:pan-left',
                        'touch-action:pan-right',
                        'touch-action:pan-y',
                        'touch-action:pan-up',
                        'touch-action:pan-down',
                        'touch-action:pinch-manipulation'
                    ]}
            >
            </ImageList>
            <StyleFunctions name="touch-action:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="touch-action:auto:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="touch-action:auto@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="touch-action:auto@print"></StyleMediaQueries>
            <StyleColorSchemes name="touch-action:auto@dark"></StyleColorSchemes>

        </>
    )
}
const localeNamespace = 'docs.css.touch-action'

TouchAction.page = {
    layout: CssDoc,
    title: 'Touch Action',
    description: 'The touch-action CSS property sets how an element\'s region can be manipulated by a touchscreen user (for example, by zooming features built into the browser).',
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
