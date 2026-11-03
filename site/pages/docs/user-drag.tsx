import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'
import ImageList from '~/components/Css/ImageList'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

export default function UserDrag() {

    return (
        <>
            <ClassTable names={[
                  ['user-drag:`value`'],
                  ['user-drag:auto'],
                  ['user-drag:element'],
                  ['user-drag:none']
            ]}>
            </ClassTable>
            <p className="hint">
                Only touch-enabled devices could test this feature.
            </p>
            
            <h2 id="overview">Overview</h2>
            <p>
                The non-standard <strong><code>user-drag </code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property controls whether the user can drag element.
            </p>
            <ImageList
                imageClass="bg:gray-50|url('/images/mountain.jpg')|no-repeat|top|left/cover"
                showClasses={
                    [
                        'user-drag:auto',
                        'user-drag:element',
                        'user-drag:none',
                    ]}
            >
            </ImageList>
            <StyleFunctions name="user-drag:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="user-drag:auto:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="user-drag:auto@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="user-drag:auto@print"></StyleMediaQueries>
            <StyleColorSchemes name="user-drag:auto@dark"></StyleColorSchemes>

        </>
    )
}
const localeNamespace = 'docs.css.user-drag'

UserDrag.page = {
    layout: CssDoc,
    title: 'User Drag',
    description: 'The non-standard user-drag  CSS property controls whether the user can drag element.',
    editors: ['Aron','Lola'],
    localeNamespace
};

export async function getStaticProps({ locale }: any) {
    return {
        props: {
            ...(await serverSideTranslations(locale, ['common', 'css', localeNamespace])),
        },
    };
}
