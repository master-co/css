import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function WhiteSpace() {

    return (
        <>
            <ClassTable names={[
               ['white-space:`value`'],
               ['break-spaces'],
               ['white-space:normal'],
               ['white-space:nowrap'],
               ['white-space:pre'],
               ['white-space:pre-line'],
               ['white-space:pre-wrap']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>white-space</code></strong>&nbsp;<a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property
                sets how <a href="https://developer.mozilla.org/en-US/docs/Glossary/Whitespace" target="blank">white space</a>&nbsp;
                inside an element is handled.
            </p>
            <StyleEditor
                tag="div"
                className="white-space:normal"
                names={[
                    'white-space:normal',
                    'white-space:nowrap',
                    'white-space:pre',
                    'white-space:pre-line',
                    'white-space:pre-wrap',
                    'break-spaces'
                ]}
                renderHtml={(className: string) => `
                    <p class="**${className}** ..articleBox..">
                        Ladies and gentlemen, 
                        the first Virtual CSS came to the world.
                        
                            It will crush all CSS and UI libraries,
                            and subvert your understanding of traditional CSS technology. 
                        
                        Keep up with the latest technological trends,
                        he will greatly improve Web interaction and execution efficiency.
                    </p>
                `}
            />
            <StyleFunctions name="white-space:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="white-space:break-spaces:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="white-space:break-spaces@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="white-space:break-spaces@print"></StyleMediaQueries>
            <StyleColorSchemes name="white-space:break-spaces@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.white-space'

WhiteSpace.page = {
    layout: CssDoc,
    title: 'White Space',
    description: 'The white-space CSS property sets how white space  inside an element is handled.',
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
