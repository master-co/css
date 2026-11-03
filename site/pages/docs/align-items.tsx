import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function AlignItems() {

    return (
        <>
            <ClassTable names={[
                ['align-items:`align`', 'ai:`align`'],
                ['align-items:normal'],
                ['align-items:baseline'],
                ['align-items:center'],
                ['align-items:stretch'],
                ['align-items:start'],
                ['align-items:end'],
                ['align-items:flex-start'],
                ['align-items:flex-end'],
                ['align-items:self-start'],
                ['align-items:self-end'],
                ['align-items:center-content']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>align-items</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property
                sets the <a href="align-self" target="blank">align-self</a> value on all direct children as a group.
                In Flexbox, it controls the alignment of items on the <a href="https://developer.mozilla.org/en-US/docs/Glossary/Cross_Axis" target="blank">Cross Axis</a>.
                In Grid Layout, it controls the alignment of items on the Block Axis within their&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Glossary/Grid_Areas" target="blank">grid area</a>.
            </p>
            <StyleEditor
                tag="div"
                className="ai:normal"
                names={[
                    'ai:normal',
                    'ai:baseline',
                    'ai:center',
                    'ai:stretch',
                    'ai:start',
                    'ai:end',
                    'ai:flex-start',
                    'ai:flex-end',
                    'ai:self-start',
                    'ai:self-end'
                ]}
                renderHtml={(className: string) => `
                <div class="**${className}** ..grid-cols:2 gap:20 w:full h:200 stripe-bg p:10..">
                    <div class="..box..">One</div>
                    <div class="..box..">Two</div>
                    <div class="..box..">Three</div>
                </div>
                `} />
            <StyleFunctions name="align-items:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="align-items:normal:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="align-items:normal@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="align-items:normal@print"></StyleMediaQueries>
            <StyleColorSchemes name="align-items:normal@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.align-items'

AlignItems.page = {
    layout: CssDoc,
    title: 'Align Items',
    description: 'The align-items CSS property sets the align-self value on all direct children as a group. In Flexbox, it controls the alignment of items on the Cross Axis. In Grid Layout, it controls the alignment of items on the Block Axis within their grid area.',
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
