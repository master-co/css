import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function FlexGrow() {

    return (
        <>
            <ClassTable names={[
                ['flex-grow:`value`']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>flex-grow</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property 
                sets the flex grow factor of a flex item&rsquo;s <a href="https://www.w3.org/TR/css-flexbox/#main-size" target="blank">main size</a>.
            </p>
            <StyleEditor
                tag="div"
                className="flex-grow:1"
                names={[
                    'flex-grow:1',
                    'flex-grow:5',
                    'flex-grow:20',
                    'flex-grow:100'
                ]}
                renderHtml={(className: string) => `
                    <div class="w:full flex gap:10 stripe-bg">
                        <div class="**${className}** ..box focus..">${className}</div>
                        <div class="flex-grow:1 ..box..">1</div>
                        <div class="flex-grow:1 ..box..">1</div>
                        <div class="flex-grow:1 ..box..">1</div>
                    </div>
                `} />
           
            <StyleFunctions name="flex-grow:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="flex-grow:1:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="flex-grow:1@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="flex-grow:1@print"></StyleMediaQueries>
            <StyleColorSchemes name="flex-grow:1@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.flex-grow'

FlexGrow.page = {
    layout: CssDoc,
    title: 'Flex Grow',
    description: 'The flex-grow CSS property sets the flex grow factor of a flex item’s main size.',
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

