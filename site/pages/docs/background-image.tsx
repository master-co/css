import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'
import ImageList from '~/components/Css/ImageList'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'


export default function BackgroundImage() {

    return (
        <>
            <ClassTable names={[
                   ['background-image:url(`…`)', 'background:url(`…`)', 'bg:url(`…`)'],
                   ['bg:linear-gradient(`…`)'],
                   ['bg:radial-gradient(`…`)'],
                   ['bg:repeating-linear-gradient(`…`)'],
                   ['bg:repeating-radial-gradient(`…`)'],
                   ['bg:conic-gradient(`…`)']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>background-image</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property
                sets one or more background images on an element.
            </p>
            <ImageList
                imageClass="bg:gray-50|url('/images/mountain.jpg')|no-repeat|top|left/cover"
                showClasses={
                    [
                        'bg:url(\'/images/mountain.jpg\')',
                        'bg:linear-gradient(#121212,#454545)',
                        'bg:radial-gradient(#121212,#454545)',
                        'bg:repeating-linear-gradient(#121212,#454545|10px)',
                        'bg:repeating-radial-gradient(#121212,#454545|10px)',
                        'bg:conic-gradient(#121212,#454545)'
                    ]}
            >
            </ImageList>
            <StyleFunctions name="bg:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="bg:url(…):hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="bg:url(…)@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="bg:url(…)@print"></StyleMediaQueries>
            <StyleColorSchemes name="bg:url(…)@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.background-image'

BackgroundImage.page = {
    layout: CssDoc,
    title: 'Background Image',
    description: 'The background-image CSS property sets one or more background images on an element.',
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

