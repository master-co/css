import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'
import ImageList from '~/components/Css/ImageList'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

export default function BackgroundClip() {

    return (
        <>
            <ClassTable names={[
                ['background-clip:`origin`'],
                ['bg:text'],
                ['background-clip:border'],
                ['background-clip:content'],
                ['background-clip:padding']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>background-clip</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property
                sets whether an element&#39;s background extends underneath its border box, padding box, or content box.
            </p>

            <ImageList
                cols="2"
                imageClass="bg:gray-60/.5|url('/images/mountain.jpg')|no-repeat|top|left/90% w:full articleBox p:10 t:center h:100!"
                showClasses={
                    [
                        'background-clip:border-box',
                        'background-clip:padding-box',
                        'background-clip:content-box',
                        'bg:text'
                    ]}
            >
                <span className="f:32 f:heavy f:white color:transparent! m:auto">Master</span>
            </ImageList>
            <StyleFunctions name="background-clip:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="background-clip:origin:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="background-clip:origin@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="background-clip:origin@print"></StyleMediaQueries>
            <StyleColorSchemes name="background-clip:origin@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.background-clip'

BackgroundClip.page = {
    layout: CssDoc,
    title: 'Background Clip',
    description: 'The background-clip CSS property sets whether an element\'s background extends underneath its border box, padding box, or content box.',
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

