import Link from '~/components/Link'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

export default function Cursor() {

    return (
        <>
            <ClassTable names={[
                ['cursor:`value`'],
                ['cursor:auto'],
                ['cursor:alias'],
                ['cursor:all-scroll'],
                ['cursor:cell'],
                ['cursor:col-resize'],
                ['cursor:context-menu'],
                ['cursor:copy'],
                ['cursor:crosshair'],
                ['cursor:default'],
                ['cursor:e-resize'],
                ['cursor:ew-resize'],
                ['cursor:grab'],
                ['cursor:grabbing'],
                ['cursor:move'],
                ['cursor:n-resize'],
                ['cursor:ne-resize'],
                ['cursor:nesw-resize'],
                ['cursor:no-drop'],
                ['cursor:none'],
                ['cursor:not-allowed'],
                ['cursor:ns-resize'],
                ['cursor:nw-resize'],
                ['cursor:nwse-resize'],
                ['cursor:pointer'],
                ['cursor:progress'],
                ['cursor:row-resize'],
                ['cursor:s-resize'],
                ['cursor:se-resize'],
                ['cursor:sw-resize'],
                ['cursor:text'],
                ['cursor:vertical-text'],
                ['cursor:w-resize'],
                ['cursor:wait'],
                ['cursor:zoom-in'],
                ['cursor:zoom-out'],
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>cursor</code></strong>&nbsp;<a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property sets 
                the <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/cursor">mouse cursor</a>, if any, to show when the mouse pointer is over an element.
            </p>
            <StyleEditor
                autofocus
                tag="div"
                className="cursor:pointer"
                names={[
                    'cursor:pointer',
                    'cursor:progress',
                    'cursor:not-allowed'
                ]}
                renderHtml={(className: string) => `
                    <div class="clear:left">
                        <div class="f:32 font-weight:900 **${className}**">Hover this line</div>
                        <p class="text-align:justify">
                            See the cursor change.
                        </p>
                    </div>
                `} />
            <StyleFunctions name="cursor:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="cursor:auto:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="cursor:auto@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="cursor:auto@sm"></StyleMediaQueries>
            <StyleColorSchemes name="cursor:auto@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.cursor'

Cursor.page = {
    layout: CssDoc,
    title: 'Cursor',
    description: 'The cursor CSS property sets the mouse cursor, if any, to show when the mouse pointer is over an element.',
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
