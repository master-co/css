import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import BoxList from '~/components/Css/BoxList'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function OutlineWidth() {

    return (
        <>
            <ClassTable names={[
                ['outline-width:`size`', 'outline:`size`'],
                ['outline:medium'],
                ['outline:thick'],
                ['outline:thin']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>outline-width</code></strong>&nbsp;<a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property
                sets the thickness of an element&#39;s outline.
                An outline is a line that is drawn around an element, outside the <a href="border">border</a>.
            </p>
            <BoxList
                showClasses={[
                    'outline:0',
                    'outline:2',
                    'outline:4',
                    'outline:8',
                    'outline:medium',
                    'outline:thick',
                    'outline:thin'
                ]}
                renderClasses="outline:solid|blue-60 mt:10">
            </BoxList>
            <StyleFunctions name="outline-width:$(size)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="outline-width:medium:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="outline-width:medium@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="outline-width:medium@print"></StyleMediaQueries>
            <StyleColorSchemes name="outline-width:medium@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.outline-width'

OutlineWidth.page = {
    layout: CssDoc,
    title: 'Outline Width',
    description: 'The outline-width CSS property sets the thickness of an element\'s outline. An outline is a line that is drawn around an element, outside the border.',
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

