import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function FlexDirection() {

    return (
        <>
            <ClassTable names={[
                ['flex-direction:`value`'],
                ['flex:row'],
                ['flex:col'],
                ['flex:col-reverse'],
                ['flex:row-reverse']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>flex-direction</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property 
                sets how flex items are placed in the flex container defining the main axis and the direction (normal or reversed).
            </p>
            <StyleEditor
                tag="div"
                className="flex-direction:unset"
                names={[
                    'flex-direction:unset',
                    'flex:row',
                    'flex:row-reverse',
                    'flex:col',
                    'flex:col-reverse'
                ]}
                renderHtml={(className: string) => `
                    <div>
                        <div class="**${className}** ..mt:10 gap:5 flex flex:1 stripe-bg..">
                            <div class="..box.. focus"> 1 </div>
                            <div class="..box.."> 2 </div>
                            <div class="..box.."> 3 </div>
                            <div class="..box.."> 4 </div>
                        </div>
                    </div>
                `} />
           
            <StyleFunctions name="flex-direction:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="flex-direction:col:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="flex-direction:col@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="flex-direction:col@print"></StyleMediaQueries>
            <StyleColorSchemes name="flex-direction:col@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.flex-direction'

FlexDirection.page = {
    layout: CssDoc,
    title: 'Flex Direction',
    description: 'The flex-direction CSS property sets how flex items are placed in the flex container defining the main axis and the direction (normal or reversed).',
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
