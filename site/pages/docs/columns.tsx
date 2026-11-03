/* eslint-disable @next/next/no-img-element */
import Link from '~/components/Link'
import { useCallback, useState } from 'react'
import Code from '~/components/Code'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

export default function Columns() {

    const [name, setName] = useState<string>()
    const styleEditorRef = useCallback(node => {
        if (node) {
            setName(node.name)
        }

    }, [])

    return (
        <>
            <ClassTable names={[
                ['columns:`value`', 'cols:`value`'],
                ['cols:`count`|`width`']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>columns</code></strong>&nbsp;<a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property sets
                the number of columns to use when drawing an element&rsquo;s contents, as well as those columns&rsquo; widths.
            </p>
            <StyleEditor ref={styleEditorRef}
                autofocus
                tag="div"
                className="cols:3"
                names={[
                    'cols:3',
                    'cols:5',
                    'cols:8em',
                    'cols:12em',
                    'cols:4|auto',
                    'cols:auto|200px'
                ]}
            >
                <div className={`gap:20 ${name}`}>
                    {
                        [
                            'strawberry-yogurt',
                            'dumpling',
                            'strawberry-crepe',
                            'croissant',
                            'drink',
                            'tomato-salad',
                            'yogurt'
                        ].map((image) =>
                            <img
                                key={image}
                                src={`/images/foods/${image}.jpg`}
                                className="mb:20 r:8 w:full object:cover"
                                alt={image} />
                        )
                    }
                </div>

            </StyleEditor>
            <Code lang="html">{
                `
                <div class="gap:20 **${name}**">
                    <img class="w:full object:cover">
                    <img class="w:full object:cover">
                </div>`
            }</Code>
            <StyleFunctions name="columns:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="columns:5:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="columns:5@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="columns:5@print"></StyleMediaQueries>
            <StyleColorSchemes name="columns:5@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.columns'

Columns.page = {
    layout: CssDoc,
    title: 'Columns',
    description: 'The columns CSS property sets the number of columns to use when drawing an element’s contents, as well as those columns’ widths.',
    subtitle: 'Layout',
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
