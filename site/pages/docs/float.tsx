import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function Float() {

    return (
        <>
            <ClassTable names={[
                ['float:`direction`'],
                ['float:left'],
                ['float:none'],
                ['float:right'],
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>float</code></strong>&nbsp;<a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property places
                an element on the left:0 or right side of its container, allowing text and inline elements to wrap around it. The element is removed from the 
                normal flow of the page, though still remaining a part of the flow (in contrast to absolute positioning).
            </p>
            <StyleEditor
                tag="div"
                className="float:left"
                names={[
                    'float:left',
                    'float:none',
                    'float:right'
                ]}
                renderHtml={(className: string) => `
                    <div>
                        <img class="**${className}** max-w:180 r:8 mb:16 aspect:1/1 object:cover mr:16" src="/images/foods/strawberry-cupcakes.jpg" >
                        <div class="f:48 font-weight:900">World's First Virtual CSS Library</div>
                        <p class="text-align:justify">
                            Using Master CSS loading, interaction, performance and productivity are upgraded to an incredible dimension.
                        </p>
                    </div>
                `} />
            <StyleFunctions name="float:$(direction)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="float:left:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="float:left@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="float:left@print"></StyleMediaQueries>
            <StyleColorSchemes name="float:left@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.float'

Float.page = {
    layout: CssDoc,
    title: 'Float',
    description: 'The float CSS property places an element on the left:0 or right side of its container, allowing text and inline elements to wrap around it. The element is removed from the normal flow of the page, though still remaining a part of the flow (in contrast to absolute positioning).',
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
