import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function ListStyleType() {

    return (
        <>
            <ClassTable names={[
                ['list-style-type:`type`'],
                ['list-style:disc'],
                ['list-style:decimal']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>list-style-type</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property
                sets the marker (such as a disc, character, or custom counter style) of a list item element.
            </p>
            <StyleEditor
                tag="p"
                className="list-style:$(type)"
            >
                {
                    <div className="grid-cols:1 grid-cols:3@md gap:12">
                        {
                            [
                                'list-style:none',
                                'list-style:disc',
                                'list-style:decimal',
                                'list-style:circle',
                                'list-style:square',
                                'list-style:decimal-leading-zero',
                                'list-style:lower-roman',
                                'list-style:lower-greek',
                                'list-style:lower-alpha',
                                'list-style:lower-latin',
                                'list-style:upper-roman',
                                'list-style:upper-alpha',
                                'list-style:upper-latin',
                                'list-style:arabic-indic',
                                'list-style:armenian',
                                'list-style:bengali',
                                'list-style:cambodian/khmer',
                                'list-style:cjk-earthly-branch',
                                'list-style:cjk-heavenly-stem',
                                'list-style:devanagari',
                                'list-style:georgian',
                                'list-style:gurmukhi',
                                'list-style:kannada',
                                'list-style:lao',
                                'list-style:malayalam',
                                'list-style:myanmar',
                                'list-style:oriya',
                                'list-style:telugu',
                                'list-style:thai'
                            ].map((className: string) => {
                                return (
                                    <div key={className} className="flex justify-content:left align-items:center w:full my:10">
                                        <div className="f:blue-60!_:where(li)::marker">
                                            <code className="bg:fade-90 bg:fade-88:hover bg:gray-20@dark bg:gray-22:hover@dark r:3 p:5|8 f:12">
                                                {className}
                                            </code>
                                            <ol className={className}>
                                                <li>First</li>
                                                <li>Second</li>
                                                <li>Third</li>
                                            </ol>
                                        </div>
                                    </div>
                                )
                            })
                        }
                    </div>
                }

            </StyleEditor>
            <StyleFunctions name="list-style-type:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="list-style-type:circle:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="list-style-type:circle@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="list-style-type:circle@print"></StyleMediaQueries>
            <StyleColorSchemes name="list-style-type:circle@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.list-style-type'

ListStyleType.page = {
    layout: CssDoc,
    title: 'List Style Type',
    description: 'The list-style-type CSS property sets the marker (such as a disc, character, or custom counter style) of a list item element.',
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
