import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function AlignContent() {

    return (
        <>
            <ClassTable names={[
                    ['align-content:`value`', 'ac:`value`'],
                    ['align-content:normal'],
                    ['align-content:baseline'],
                    ['align-content:center'],
                    ['align-content:stretch'],
                    ['align-content:start'],
                    ['align-content:end'],
                    ['align-content:flex-start'],
                    ['align-content:flex-end'],
                    ['align-content:space-around'],
                    ['align-content:space-between'],
                    ['align-content:space-evenly']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>align-content</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property 
                sets the distribution of space between and around content items along a&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Flexible_Box_Layout" target="blank">flexbox</a>&rsquo;s cross-axis or a&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout" target="blank">grid</a>&rsquo;s block axis.
            </p>
            <StyleEditor
                tag="div"
                className="ac:normal"
                names={[
                    'ac:normal',
                    'ac:baseline',
                    'ac:center',
                    'ac:stretch',
                    'ac:start',
                    'ac:end',
                    'ac:flex-start',
                    'ac:flex-end',
                    'ac:space-around',
                    'ac:space-between',
                    'ac:space-evenly'
                ]}
                renderHtml={(className: string) => `
                <div class="**${className}** ..grid-cols:2 gap:20 w:full h:200 stripe-bg p:10..">
                    <div class="f:12! ..box..">One</div>
                    <div class="f:14! ..box..">Two</div>
                    <div class="f:16! ..box..">Three</div>
                </div>
                `} />
            <StyleFunctions name="align-content:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="align-content:normal:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="align-content:normal@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="align-content:normal@print"></StyleMediaQueries>
            <StyleColorSchemes name="align-content:normal@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.align-content'

AlignContent.page = {
    layout: CssDoc,
    title: 'Align Content',
    description: 'The align-content CSS property sets the distribution of space between and around content items along a flexbox’s cross-axis or a grid’s block axis.',
    editors: ['Aron','Lola'],
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
