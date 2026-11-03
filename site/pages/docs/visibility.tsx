import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import BoxList from '~/components/Css/BoxList'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function Visibility() {
    return (
        <>
            <ClassTable names={[
                ['visibility:`value`'],
                ['visible'],
                ['invisible'],
                ['visibility:collapse']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>visibility</code></strong>&nbsp;<a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property
                shows or hides an element without changing the layout of a document.
                The property can also hide rows or columns in a <a href="https://developer.mozilla.org/en-US/docs/Web/HTML/Element/table" target="blank"><code>&lt;table&gt;</code></a>.
            </p>
            <h3 id="block">Block</h3>
            <StyleEditor
                autofocus
                tag="div"
                className="visible"
                names={[
                    'visible',
                    'invisible',
                    'visibility:collapse',
                ]}
                renderHtml={(className: string) => `
                    <div class="w:1/2 align-items:center t:center stripe-bg">
                        <code class="**${className}** ..box focus w:full m:auto..">Virtual CSS</code>
                    </div>
                `} />
            <h3 id="table">Table</h3>

            <StyleEditor
                tag="div"
                className="visible"
                names={[
                    'visible',
                    'invisible',
                    'visibility:collapse',
                ]}
                renderHtml={(className: string) => `
                    <table class="table-layout:auto ..docTable..">
                        <thead>
                            <tr>
                                <th>Lorem ipsum</th>
                                <th>Ut enim</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr class="**${className}** bg:blue-70/.2">
                                <td>dolor sit amet</td>
                                <td>ad minim</td>
                            </tr>
                            <tr>
                                <td>consectetur	</td>
                                <td>veniam</td>
                            </tr>
                            <tr>
                                <td>adipiscing</td>
                                <td>quis</td>
                            </tr>
                        </tbody>
                    </table>
                `} />
            <StyleFunctions name="visibility:$(style)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="visibility:visible:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="visibility:visible@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="visibility:visible@print"></StyleMediaQueries>
            <StyleColorSchemes name="visibility:visible@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.visibility'

Visibility.page = {
    layout: CssDoc,
    title: 'Visibility',
    description: 'The visibility CSS property shows or hides an element without changing the layout of a document. The property can also hide rows or columns in a <table>.',
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
