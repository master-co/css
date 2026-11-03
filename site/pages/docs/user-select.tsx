import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import TextList from '~/components/Css/TextList'
import CssDoc from '~/layouts/CssDoc'

export default function UserSelect() {
    return (
        <>
            <ClassTable names={[
                  ['user-select:`value`'],
                  ['user-select:all'],
                  ['user-select:auto'],
                  ['user-select:none'],
                  ['user-select:text']
            ]}>
            </ClassTable>

            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>user-select</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property 
                property controls whether the user can select text. 
                This doesn&#39;t have any effect on content loaded as part of a browser&#39;s user interface (its chrome), except in textboxes.
            </p>
            <TextList
                showClasses={[
                    'user-select:all',
                    'user-select:auto',
                    'user-select:none',
                    'user-select:text'
                ]}
                renderClasses="f:50 my:0!"
            >
            </TextList>
            <StyleFunctions name="user-select:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="user-select:auto:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="user-select:auto@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="user-select:auto@print"></StyleMediaQueries>
            <StyleColorSchemes name="user-select:auto@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.user-select'

UserSelect.page = {
    layout: CssDoc,
    title: 'User Select',
    description: 'The user-select CSS property property controls whether the user can select text. This doesn\'t have any effect on content loaded as part of a browser\'s user interface (its chrome), except in textboxes.',
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
}
