import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function GridAutoFlow() {

    return (
        <>
            <ClassTable names={[
                ['grid-auto-flow:`value`'],
                ['grid-auto-flow:row'],
                ['grid-auto-flow:column'],
                ['grid-auto-flow:dense'],
                ['grid-auto-flow:row|dense'],
                ['grid-auto-flow:column|dense']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>grid-auto-flow</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property
                controls how the auto-placement algorithm works, specifying exactly how auto-placed items get flowed into the grid.
            </p>
            <StyleEditor
                tag="div"
                className="grid-auto-flow:row"
                names={[
                    'grid-auto-flow:row',
                    'grid-auto-flow:column',
                    'grid-auto-flow:dense',
                    'grid-auto-flow:row|dense',
                    'grid-auto-flow:column|dense'
                ]}
                renderHtml={(className: string) => `
                <div class="**${ className }** d:grid grid-template:repeat(3,1fr)/repeat(3,1fr) ..gap:10 stripe-bg..">
                    <div class="grid-row-start:2 ..box focus..">1</div>
                    <div class="grid-col-start:2 ..box focus..">2</div>
                    <div class="..box..">3</div>
                    <div class="..box..">4</div>
                    <div class="..box..">5</div>
                    <div class="..box..">6</div>
                    <div class="..box..">7</div>
                    <div class="..box..">8</div>
                    <div class="..box..">9</div>
                </div>
                `} />
            <StyleFunctions name="grid-auto-flow:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="grid-auto-flow:row:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="grid-auto-flow:row@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="grid-auto-flow:row@print"></StyleMediaQueries>
            <StyleColorSchemes name="grid-auto-flow:row@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.grid-auto-flow'

GridAutoFlow.page = {
    layout: CssDoc,
    title: 'Grid Auto Flow',
    description: 'The grid-auto-flow CSS property controls how the auto-placement algorithm works, specifying exactly how auto-placed items get flowed into the grid.',
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
