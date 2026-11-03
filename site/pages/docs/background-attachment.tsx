import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'
import ImageList from '~/components/Css/ImageList'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

export default function BackgroundAttachment() {

    return (
        <>
            <ClassTable names={[
                    ['background-attachment:`value`', 'background:`value`', 'bg:`value`'],
                    ['bg:fixed'],
                    ['bg:local'],
                    ['bg:scroll'],
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>background-attachment</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property
                sets whether a background image&#39;s position is fixed within the&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Glossary/Viewport" target="blank">viewport</a>
                , or scrolls with its containing block.
            </p>

            <ImageList
                imageClass="
                    aspect:1/1 w:full h:150 mt:15 overflow-y:scroll scrollbar 
                    bg:url('/images/circle.svg')|center|center/50%|50%|no-repeat,url('/images/wallpaper.jpg')|left|top/cover"
                showClasses={
                    [
                        'bg:scroll',
                        'bg:local',
                        'bg:fixed'
                    ]}
            >
                <p className="f:32 f:heavy f:white! pt:25 h:300">Master</p>
            </ImageList>
            <StyleFunctions name="background-attachment:$(mode)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="background-attachment:scroll:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="background-attachment:scroll@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="background-attachment:scroll@print"></StyleMediaQueries>
            <StyleColorSchemes name="background-attachment:scroll@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.background-attachment'

BackgroundAttachment.page = {
    layout: CssDoc,
    title: 'Background Attachment',
    description: 'The background-attachment CSS property sets whether a background image\'s position is fixed within the viewport, or scrolls with its containing block.',
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

