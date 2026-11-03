import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function Overflow() {

    return (
        <>
            <ClassTable names={[
                ['overflow'],
                ['overflow:auto'],
                ['overflow:hidden'],
                ['overflow:overlay'],
                ['overflow:scroll'],
                ['overflow:clip'],
                ['overflow-x:auto'],
                ['overflow-y:auto'],
                ['overflow-x:hidden'],
                ['overflow-y:hidden'],
                ['overflow-x:overlay'],
                ['overflow-y:overlay'],
                ['overflow-x:scroll'],
                ['overflow-y:scroll'],
                ['overflow-x:visible'],
                ['overflow-y:visible'],
                ['overflow-x:clip'],
                ['overflow-y:clip']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>overflow</code></strong>&nbsp;<a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/Shorthand_properties" target="blank">shorthand property</a>sets the desired
                behavior for an element&rsquo;s overflow — i.e. when an element&rsquo;s content is too big to fit in its
                <a href="https://developer.mozilla.org/en-US/docs/Web/Guide/CSS/Block_formatting_context" target="blank"> block formatting context </a>
                — in both directions.
            </p>
            <StyleEditor
                tag="div"
                className="overflow:hidden"
                names={[
                    'overflow:hidden',
                    'overflow:scroll',
                    'overflow-x:hidden'
                ]}
                renderHtml={(className: string) => `
                    <p class="**${className}** overscroll-behavior:contain max-h:100 ..articleBox..">
                        Ladies and gentlemen, the first Virtual CSS came to the world.It will crush all CSS and UI libraries,
                        and subvert your understanding of traditional CSS technology. Keep up with the latest technological trends,
                        he will greatly improve Web interaction and execution efficiency.
                    </p>
                `}
            />
            <StyleFunctions name="overflow:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="overflow:auto:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="overflow:auto@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="overflow:auto@print"></StyleMediaQueries>
            <StyleColorSchemes name="overflow:auto@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.overflow'

Overflow.page = {
    layout: CssDoc,
    title: 'Overflow',
    description: 'The overflow CSS shorthand propertysets the desired behavior for an element’s overflow — i.e. when an element’s content is too big to fit in its block formatting context — in both directions.',
    editors: ['Aron', 'Lola'],
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

