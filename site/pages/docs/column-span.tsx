/* eslint-disable @next/next/no-img-element */
import Link from '~/components/Link'
import { useCallback, useState, useEffect } from 'react'
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

export default function ColumnSpan() {

    const [name, setName] = useState<string>()
    const styleEditorRef = useCallback(node => {
        if (node) {
            setName(node.name)
        }

    }, [])

    return (
        <>
            <ClassTable names={[
                ['column-span:`value`', 'col-span:`value`'],
                ['col-span:all'],
                ['col-span:none'],
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>column-span</code></strong>&nbsp;<a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property makes
                it possible for an element to span across all columns when its value is set to <strong>all</strong>.
            </p>
            <StyleEditor ref={styleEditorRef}
                autofocus
                tag="div"
                className="col-span:none"
                names={[
                    'col-span:none',
                    'col-span:all'
                ]}>
                <div className="cols:5 gap:20">
                    {
                        [
                            'strawberry-yogurt',
                            'dumpling',
                            'strawberry-crepe',
                            'croissant',
                            'drink',
                            'tomato-salad',
                            'yogurt'
                        ].map((image, index) => {
                            return (
                                index === 3 ?
                                    <div key={image}
                                        className={`
                                        ${name} background-blend-mode:color-burn! w:full bg:cover bg:center my:20 r:8 flex center-content
                                        ${name?.includes('all') ? 'aspect:5/1 bg:gray/.9|url(/images/foods/drink.jpg)' : 'aspect:1/1 bg:gray/.9|url(/images/foods/drink.jpg)'}
                                        `}>
                                        <code className="f:12 f:white my:auto">{name}</code>
                                    </div>
                                    : <img
                                        key={image}
                                        src={`/images/foods/${image}.jpg`}
                                        className="mb:20 r:8 w:full object:cover"
                                        alt={image} />
                            )
                        })
                    }
                </div>
            </StyleEditor>
            <Code lang="html">{
                `
                <div class="cols:5 gap:20">
                    <img class="w:full object:cover">
                    <img class="w:full object:cover">
                    ...
                    <div class="**${name}**"></div>
                    <img class="w:full object:cover">
                    <img class="w:full object:cover">
                </div>`
            }</Code>
            <StyleFunctions name="column-span:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="column-span:all:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="column-span:all@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="column-span:all@print"></StyleMediaQueries>
            <StyleColorSchemes name="column-span:all@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.column-span'

ColumnSpan.page = {
    layout: CssDoc,
    title: 'Column Span',
    description: 'The column-span CSS property makes it possible for an element to span across all columns when its value is set to all.',
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

