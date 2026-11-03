import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function JustifyContent() {

    return (
        <>
            <ClassTable names={[
                ['justify-content:`justify`', 'jc:`justify`'],
                ['justify-content:normal'],
                ['justify-content:left'],
                ['justify-content:center'],
                ['justify-content:right'],
                ['justify-content:stretch'],
                ['justify-content:start'],
                ['justify-content:end'],
                ['justify-content:flex-start'],
                ['justify-content:flex-end'],
                ['justify-content:space-around'],
                ['justify-content:space-between'],
                ['justify-content:space-evenly'],
                ['justify-content:center-content']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>justify-content</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property
                defines how the browser distributes space between and around content items along the&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Glossary/Main_Axis" target="blank">main-axis</a>&nbsp;
                of a flex container, and the inline axis of a grid container.
            </p>
            <StyleEditor
                tag="div"
                className="jc:normal"
                names={[
                    'jc:normal',
                    'jc:left',
                    'jc:center',
                    'jc:right',
                    'jc:stretch',
                    'jc:start',
                    'jc:end',
                    'jc:flex-start',
                    'jc:flex-end',
                    'jc:space-around',
                    'jc:space-between',
                    'jc:space-evenly'
                ]}
                renderHtml={(className: string) => `
                <div class="**${className}** ..flex gap:20 w:full p:10 stripe-bg..">
                    <div class="f:12! ..box..">One</div>
                    <div class="f:14! ..box..">Two</div>
                    <div class="f:16! ..box..">Three</div>
                </div>
                `} />
            <StyleFunctions name="justify-content:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="justify-content:normal:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="justify-content:normal@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="justify-content:normal@print"></StyleMediaQueries>
            <StyleColorSchemes name="justify-content:normal@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.justify-content'

JustifyContent.page = {
    layout: CssDoc,
    title: 'Justify Content',
    description: 'The justify-content CSS property defines how the browser distributes space between and around content items along the main-axis  of a flex container, and the inline axis of a grid container.',
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

