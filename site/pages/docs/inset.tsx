import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function Inset() {

    return (
        <>
            <ClassTable names={[
                ['inset:offset'],
                ['inset:offset|offset'],
                ['inset:offset|offset|offset'],
                ['inset:offset|offset|offset|offset'],
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>inset</code></strong>&nbsp;<a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property is 
                a shorthand that corresponds to the&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/top" target="blank">top</a>,&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/right" target="blank">right</a>,&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/bottom" target="blank">bottom</a>,&nbsp;
                and/or <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/left" target="blank">left</a> properties. 
                It has the same multi-value syntax of the margin shorthand.
            </p>
            <StyleEditor
                tag="div"
                className="inset:10"
                names={[
                    'inset:10',
                    'inset:10|20',
                    'inset:10|20|30',
                    'inset:10|20|30|40'
                ]}
                renderHtml={(className: string) => `
                    <div class="rel w:300 aspect:3/1 ..stripe-bg..">
                        <code class="**${className}** ~inset|.3s ..abs bg:blue flex center-content f:white f:14..">
                            inset:10
                        </code>
                    </div>
                `} />
            <StyleFunctions name="inset:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="inset:10:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="inset:10@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="inset:10@print"></StyleMediaQueries>
            <StyleColorSchemes name="inset:10@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.inset'

Inset.page = {
    layout: CssDoc,
    title: 'Inset',
    description: 'The inset CSS property is a shorthand that corresponds to the top, right, bottom,  and/or left properties. It has the same multi-value syntax of the margin shorthand.',
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

