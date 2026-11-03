import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function FlexShrink() {

    return (
        <>
            <p>
                The <strong><code>flex-shrink</code></strong>&nbsp;
                is used alongside the other flex properties&nbsp;
                <a href="flex-grow" target="blank">flex-grow</a> and&nbsp; 
                <a href="flex-basis" target="blank">flex-basis</a>, and 
                normally defined using the <a href="flex" target="blank">flex</a> shorthand.
            </p>
            <ClassTable names={[
                ['flex-shrink:`value`']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>flex-shrink</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property 
                sets the flex shrink factor of a flex item. If the size of all flex items is larger than the 
                flex container, items shrink to fit according to <strong>flex-shrink</strong>.
            </p>
            <StyleEditor
                tag="div"
                className="flex-shrink:0"
                names={[
                    'flex-shrink:0',
                    'flex-shrink:10',
                    'flex-shrink:100',
                    'flex-shrink:300'
                ]}
                renderHtml={(className: string) => `
                    <div class="w:full flex gap:10 stripe-bg">
                        <div class="**${className}** flex-basis:300 ..box focus..">${className}</div>
                        <div class="flex-shrink:300 flex-basis:300 ..box..">1</div>
                        <div class="flex-shrink:300 flex-basis:300 ..box..">1</div>
                        <div class="flex-shrink:300 flex-basis:300 ..box..">1</div>
                    </div>
                `} />
           
            <StyleFunctions name="flex-shrink:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="flex-shrink:1:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="flex-shrink:1@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="flex-shrink:1@print"></StyleMediaQueries>
            <StyleColorSchemes name="flex-shrink:1@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.flex-shrink'

FlexShrink.page = {
    layout: CssDoc,
    title: 'Flex Shrink',
    description: 'The flex-shrink  is used alongside the other flex properties flex-grow and flex-basis, and normally defined using the flex shorthand.',
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

