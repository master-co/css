import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'
import ImageList from '~/components/Css/ImageList'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'


export default function BackgroundRepeat() {


    return (
        <>
            <ClassTable names={[
                    ['background-repeat:`mode`', 'bg:`mode`'],
                    ['background-repeat:`horizontal`|`vertical`'],
                    ['bg:repeat'],
                    ['bg:no-repeat'],
                    ['bg:repeat-x'],
                    ['bg:repeat-y'],
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>background-repeat</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property
                sets how background images are repeated. 
                A background image can be repeated along the horizontal and vertical axes, or not repeated at all.
            </p>
            <ImageList
                imageClass="bg:gray-50|url('/images/mountain.jpg')|no-repeat|top|left/50%"
                showClasses={
                    [
                        'bg:repeat',
                        'bg:no-repeat',
                        'bg:repeat-x',
                        'bg:repeat-y',
                        'bg:space',
                        'bg:round'
                    ]}
            >
            </ImageList>
            <StyleFunctions name="background-repeat:$(mode)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="background-repeat:repeat:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="background-repeat:repeat@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="background-repeat:repeat@print"></StyleMediaQueries>
            <StyleColorSchemes name="background-repeat:repeat@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.background-repeat'

BackgroundRepeat.page = {
    layout: CssDoc,
    title: 'Background Repeat',
    description: 'The background-repeat CSS property sets how background images are repeated. A background image can be repeated along the horizontal and vertical axes, or not repeated at all.',
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

