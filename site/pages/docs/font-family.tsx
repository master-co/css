import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import TextList from '~/components/Css/TextList'
import CssDoc from '~/layouts/CssDoc'

export default function FontFamily() {
    return (
        <>
            <ClassTable names={[
                ['font-family:`value`', 'font:`value`', 'f:`value`'],
                ['font:serif'],
                ['font:mono'],
                ['font:sans']
            ]}>
            </ClassTable>

            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>font-family</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property 
                specifies a prioritized list of one or more font family names and/or generic family
                names for the selected element.
            </p>
            <TextList
                showClasses={[
                    'font:serif',
                    'font:mono',
                    'font:sans'
                ]}
                renderClasses="f:50 my:0!"
            >
            </TextList>
            <StyleFunctions name="font-family:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="font-family:mono:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="font-family:mono@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="font-family:mono@print"></StyleMediaQueries>
            <StyleColorSchemes name="font-family:mono@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.font-family'

FontFamily.page = {
    layout: CssDoc,
    title: 'Font Family',
    description: 'The font-family CSS property specifies a prioritized list of one or more font family names and/or generic family names for the selected element.',
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
