import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import BoxList from '~/components/Css/BoxList'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function OutlineStyle() {

    return (
        <>
            <ClassTable names={[
                ['outline-style:`style`'],
                ['outline:none'],
                ['outline:dotted'],
                ['outline:dashed'],
                ['outline:solid'],
                ['outline:double'],
                ['outline:groove'],
                ['outline:ridge'],
                ['outline:inset'],
                ['outline:outset']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>outline-style</code></strong>&nbsp;<a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property
                sets the style of an element&#39;s outline.
                An outline is a line that is drawn around an element, outside the <a href="border">border</a>.
            </p>
            <BoxList
                showClasses={[
                    'outline:none',
                    'outline:dotted',
                    'outline:dashed',
                    'outline:solid',
                    'outline:double',
                    'outline:groove',
                    'outline:ridge',
                    'outline:inset',
                    'outline:outset'
                ]}
                renderClasses="outline:5|blue-60 mt:10">
            </BoxList>
            <StyleFunctions name="outline-style:$(style)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="outline-style:solid:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="outline-style:solid@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="outline-style:solid@print"></StyleMediaQueries>
            <StyleColorSchemes name="outline-style:solid@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.outline-style'

OutlineStyle.page = {
    layout: CssDoc,
    title: 'Outline Style',
    description: 'The outline-style CSS property sets the style of an element\'s outline. An outline is a line that is drawn around an element, outside the border.',
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

