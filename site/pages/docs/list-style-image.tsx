import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function ListStyleImage() {

    return (
        <>
            <ClassTable names={[
                ['list-style-image:url(`…`)', 'list-style:url(`…`)'],
                ['list-style:linear-gradient(`…`)'],
                ['list-style:radial-gradient(`…`)'],
                ['list-style:repeating-linear-gradient(`…`)'],
                ['list-style:repeating-radial-gradient(`…`)'],
                ['list-style:conic-gradient(`…`)']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>list-style-image</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property
                sets an image to be used as the list item marker.
            </p>
            <StyleEditor
                tag="p"
                className="list-style:url('/images/checkbox.svg')"
                names={[
                    'list-style:url(\'/images/checkbox.svg\')',
                    'list-style:linear-gradient(#7599ff,#61ffd3)',
                    'list-style:conic-gradient(#7599ff,#61ffd3)'
                ]}
                renderHtml={(className: string) => `
                <div class="f:30!_:where(li)::marker lh:1.5!_:where(li)::marker lh:1.5!_:where(li) ..flex flex:col w:full align-items:center..">
                    <ol class="**${className}**">
                        <li>First</li>
                        <li>Second</li>
                        <li>Third</li>
                    </ol>
                </div>
                `} />
            <StyleFunctions name="list-style-image:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="list-style-image:url(…):hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="list-style-image:url(…)@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="list-style-image:url(…)@print"></StyleMediaQueries>
            <StyleColorSchemes name="list-style-image:url(…)@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.list-style-image'

ListStyleImage.page = {
    layout: CssDoc,
    title: 'List Style Image',
    description: 'The list-style-image CSS property sets an image to be used as the list item marker.',
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
