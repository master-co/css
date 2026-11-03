import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import BoxList from '~/components/Css/BoxList'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function BoxShadow() {

    return (
        <>
            <ClassTable names={[
                ['box-shadow:`value`,`…`', 'shadow:`value`,`…`'],
                ['shadow:`offset-x`|`offset-y`|`color`'],
                ['shadow:`offset-x`|`offset-y`|`blur-radius`|`color`}`'],
                ['shadow:`offset-x`|`offset-y`|`blur-radius`|`spread-radius`|`color`'],
                ['shadow:inset;`offset-x`|`offset-y`|`color`'],
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>box-shadow</code></strong>&nbsp;<a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property
                adds shadow effects around an element&#39;s frame. You can set multiple effects separated by commas.
                A box shadow is described by X and Y offsets relative to the element, blur and spread radius, and color.
            </p>
            <StyleEditor
                tag="div"
                className="box-shadow:8|8|gray-70"
                names={[
                    'box-shadow:8|8|gray-70',
                    'box-shadow:8|8|3|gray-70',
                    'box-shadow:0|0|3|5|gray-70',
                    'box-shadow:inset|5|5|gray-70',
                    'box-shadow:inset|5|5|3|gray-70',
                    'box-shadow:inset|0|0|3|5|gray-70',
                ]}
                renderHtml={(className: string) => `
                    <div class="**${className}**! ..w:200 h:80 box..">
                    </div>
                `}
            />
            <StyleFunctions name="box-shadow:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="box-shadow:1|2|3|blue:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="box-shadow:1|2|3|blue@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="box-shadow:1|2|3|blue@print"></StyleMediaQueries>
            <StyleColorSchemes name="box-shadow:1|2|3|blue@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.box-shadow'

BoxShadow.page = {
    layout: CssDoc,
    title: 'Box Shadow',
    description: 'The box-shadow CSS property adds shadow effects around an element\'s frame.',
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
