import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import ShorthandList from '~/components/Css/ShorthandList'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function Transition() {

    return (
        <>
            <ClassTable names={[
                ['transition:`name`|`duration`', '~`name`|`duration`'],
                ['transition:`name`|`duration`,`…`'],
                [ '~:`name`|`duration`,`…`'],
                ['transition:`name`|`duration`|`delay`', '~`name`|`duration`|`delay`'],
                ['transition:`name`|`duration`|`timing-function`', '~`name`|`duration`|`timing-function`'],
                ['transition:`name`|`duration`|`timing-function`|`delay`', '~`name`|`duration`|`timing-function`|`delay`'],
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>transition</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/Shorthand_properties" target="blank">shorthand property</a>&nbsp;
                define the transition between two states of an element.
                <br/>
                It is a shorthand for:
            </p>
            <ShorthandList items={[
                'transition-delay',
                'transition-duration',
                'transition-property',
                'transition-timing-function'
            ]}>
            </ShorthandList>

            <StyleEditor 
                showCss 
                className="~padding|300ms|ease-in"
                renderHtml={(className: string) => `
                <div class="..stripe-bg flex align-items:center..">
                    <div class="
                        bg:blue-60/.2
                        {bg:red-60/.2;px:50}:hover 
                        **${className}** ..p:12|15 block f:14 r:5..">${className}
                    </div>
                </div>
                `}
                >
            </StyleEditor>

            <StyleFunctions name="transition:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="transition:padding|300ms|ease-in:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="transition:padding|300ms|ease-in@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="transition:padding|300ms|ease-in@print"></StyleMediaQueries>
            <StyleColorSchemes name="transition:padding|300ms|ease-in@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.transition'

Transition.page = {
    layout: CssDoc,
    title: 'Transition',
    description: 'The transition CSS shorthand property  define the transition between two states of an element.',
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