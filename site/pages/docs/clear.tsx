import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function Clear() {

    return (
        <>
            <ClassTable names={[
                ['clear:`type`'],
                ['clear:both'],
                ['clear:left'],
                ['clear:none'],
                ['clear:right']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>clear</code></strong>&nbsp;<a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property sets
                whether an element must be moved below (cleared) floating elements that precede it. The clear property applies to floating and non-floating elements.
            </p>
            <StyleEditor
                hideTagInput
                tag="div"
                className="clear:none"
                names={[
                    'clear:none',
                    'clear:left',
                    'clear:right',
                    'clear:both'
                ]}
                demoClassName="py:0"
                renderHtml={(className: string) => `
                    ~~<article class="docCard">~~
                        <img class="float:left ..square r:5 object:cover mb:20 mr:20 ${className === 'clear:left' ? 'w:64' : 'w:128'}.." src="/images/foods/strawberry-cupcakes.jpg"/>
                        <img class="float:right ..square r:5 object:cover mb:20 ml:20 ${className === 'clear:right' ? 'w:64' : 'w:128'}.." src="/images/foods/strawberry-yogurt.jpg"/>
                        <p class="**${className}** my:0">
                            The clear CSS property sets whether an element must be moved below (cleared) floating elements that precede it. The clear property applies to floating and non-floating elements.
                        </p>
                    ~~</article>~~
                `} />
            <StyleFunctions name="clear:both:$(type)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="clear:both:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="clear:both@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="clear:both@print"></StyleMediaQueries>
            <StyleColorSchemes name="clear:both@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.clear'

Clear.page = {
    layout: CssDoc,
    title: 'Clear',
    description: 'The clear CSS property sets whether an element must be moved below (cleared) floating elements that precede it. The clear property applies to floating and non-floating elements.',
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
