import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function TableLayout() {

    return (
        <>
            <ClassTable names={[
                ['table-layout:`value`'],
                ['table-layout:auto'],
                ['table-layout:fixed']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>table-layout</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property
                sets the algorithm used to lay out <a href="https://developer.mozilla.org/en-US/docs/Web/HTML/Element/table" target="blank"><code>&lt;table&gt;</code></a>&nbsp;
                cells, rows, and columns.
            </p>
            <StyleEditor
                tag="div"
                className="table-layout:auto"
                names={[
                    'table-layout:auto',
                    'table-layout:fixed'
                ]}
                renderHtml={(className: string) => `
                    <table class="**${className}** ..docTable..">
                        <thead>
                            <tr>
                                <th>Lorem ipsum</th>
                                <th>Ut enim</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
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
            <StyleFunctions name="table-layout:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="table-layout:auto:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="table-layout:auto@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="table-layout:auto@print"></StyleMediaQueries>
            <StyleColorSchemes name="table-layout:auto@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.table-layout'

TableLayout.page = {
    layout: CssDoc,
    title: 'Table Layout',
    description: 'The table-layout CSS property sets the algorithm used to lay out <table>  cells, rows, and columns.',
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

