import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function BorderCollapse() {

    return (
        <>
            <ClassTable names={[
                ['border-collapse:`value`', 'border:`value`'],
                ['border:collapse'],
                ['border:separate']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>border-collapse</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property
                sets whether cells inside a <a href="https://developer.mozilla.org/en-US/docs/Web/HTML/Element/table" target="blank"><code>&lt;table&gt;</code></a>&nbsp;
                have shared or separate borders.
            </p>
            <StyleEditor
                tag="div"
                className="border-collapse:collapse"
                names={[
                    'border-collapse:collapse',
                    'border-collapse:separate'
                ]}
                renderHtml={(className: string) => `
                    <table class="**${className}** border-spacing:10 ..docTable..">
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

            <StyleFunctions name="border-collapse:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="border-collapse:collapse:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="border-collapse:collapse@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="border-collapse:collapse@print"></StyleMediaQueries>
            <StyleColorSchemes name="border-collapse:collapse@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.border-collapse'

BorderCollapse.page = {
    layout: CssDoc,
    title: 'Border Collapse',
    description: 'The border-collapse CSS property sets whether cells inside a <table>  have shared or separate borders.',
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

