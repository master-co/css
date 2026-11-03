import Link from '~/components/Link'
// import { useCallback, useState } from 'react'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
// import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

export default function Appearance() {

    return (
        <>
            <ClassTable names={[
                ['appearance:`value`'],
                ['appearance:none'],
                ['appearance:auto'],
                ['appearance:menulist-button'],
                ['appearance:textfield'],
                ['appearance:button'],
                ['appearance:searchfield'],
                ['appearance:textarea'],
                ['appearance:push-button'],
                ['appearance:slider-horizontal'],
                ['appearance:checkbox'],
                ['appearance:square-button'],
                ['appearance:menulist'],
                ['appearance:listbox'],
                ['appearance:meter'],
                ['appearance:progress-bar']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>appearance</code></strong>&nbsp;<a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property 
                is used to display an element using platform-native styling, based on the operating system&rsquo;s theme.
            </p>
            <StyleFunctions name="appearance:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="appearance:auto:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="appearance:auto@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="appearance:auto@sm"></StyleMediaQueries>
            <StyleColorSchemes name="appearance:auto@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.appearance'

Appearance.page = {
    layout: CssDoc,
    title: 'Appearance',
    description: 'The appearance CSS property is used to display an element using platform-native styling, based on the operating system’s theme.',
    editors: ['Aron','Lola'],
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
}
