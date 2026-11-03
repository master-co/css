import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function Contain() {


    return (
        <>
            <ClassTable names={[
                    ['contain:`type`'],
                    ['contain:none'],
                    ['contain:strict'],
                    ['contain:content'],
                    ['contain:size'],
                    ['contain:layout'],
                    ['contain:style'],
                    ['contain:paint']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>contain</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property
                allows an author to indicate that an element and its contents are, as much as possible, independent of the rest of the document tree. 
                This allows the browser to recalculate layout, style, paint, size, or any combination of them for a limited area of the DOM and not the entire page, leading to obvious performance benefits.
            </p>
            <div className="demo justify-content:start! grid-cols:4! gap:20">
            {
                 [
                    'contain:none',
                    'contain:strict',
                    'contain:content',
                    'contain:size',
                    'contain:layout',
                    'contain:style',
                    'contain:paint'
                ].map((className:string)=> {
                    return (
                        <div key="className" className="flex flex:col w:full align-items:center">
                            <code className="f:12 mb:10">{className}</code>
                            <div className={`bg:gray-20/.1 bg:gray-80/.08@dark r:3 b:gray-57 b:2 ${className} p:12`}>
                                <div className="bg:blue-60/.1 p:12|15 b:blue-70 r:3 b:2 ml:-25 aspect:1/1 w:full">

                                </div>
                            </div>
                        </div>
                    )
                })
            }
            </div>
            <StyleFunctions name="contain:$(type)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="contain:content:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="contain:content@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="contain:content@print"></StyleMediaQueries>
            <StyleColorSchemes name="contain:content@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.contain'

Contain.page = {
    layout: CssDoc,
    title: 'Contain',
    description: 'The contain CSS property allows an author to indicate that an element and its contents are, as much as possible, independent of the rest of the document tree.',
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
