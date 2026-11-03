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

export default function Direction() {

    const [name, setName] = useState<string>()
    const styleEditorRef = useCallback(node => {
        if (node) {
            setName(node.name)
        }
    }, [])

    return (
        <>
            <ClassTable names={[
                ['direction:ltr'],
                ['direction:rtl']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>direction</code></strong>&nbsp;<a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property sets the direction of text, table columns, and horizontal overflow. Use rtl for languages written from right to left
                (like Hebrew or Arabic), and ltr for those written from left to right (like English and most other languages).
            </p>
            <StyleEditor ref={styleEditorRef}
                autofocus
                tag="div"
                className="direction:ltr"
                names={[
                    'direction:ltr',
                    'direction:rtl'
                ]}>
                <div className="w:450">
                    <div className="flex flex:col w:full align-items:center p:10">
                        <code className="f:12">{name}</code>
                        <div className={`${name} mt:20 b:2|solid|blue-32 b:blue-52!@dark w:1/2 aspect:1/1 grid-cols:2! p:5 gap:10|5 align-items:center`}>
                            {
                                [
                                    ...Array.from(Array(4).keys())
                                ].map((ary, index) =>
                                    <div
                                        key={ary}
                                        className={`p:5 flex flex:col w:full aspect:1/1 center-content b:2|solid
                                            ${index === 0 ? 'b:red! b:red-60!@dark bg:red/.2' : ''}
                                            ${index === 1 ? 'b:blue! b:blue-60!@dark bg:blue/.2' : ''}
                                            ${index === 2 ? 'b:green! b:green-40!@dark bg:green/.2' : ''}
                                            ${index === 3 ? 'b:purple! b:purple-40!@dark bg:purple/.2' : ''}
                                    `}
                                    >
                                        <code className={`f:32
                                        ${index === 0 ? 'f:red' : ''}
                                        ${index === 1 ? 'f:blue' : ''}
                                        ${index === 2 ? 'f:green' : ''}
                                        ${index === 3 ? 'f:purple' : ''}
                                    `}>
                                            {index + 1}
                                        </code>
                                    </div>
                                )
                            }
                        </div>
                    </div>
                </div>
            </StyleEditor>
            <Code lang="html">{`
                <div class="\`${name}\` ...">
                    <div class="...">1</div>
                    <div class="...">2</div>
                    <div class="...">3</div>
                    <div class="...">4</div>
                </div>
            `}</Code>
            <StyleFunctions name="direction:ltr"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="direction:ltr:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="direction:ltr@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="direction:ltr@print"></StyleMediaQueries>
            <StyleColorSchemes name="direction:ltr@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.direction'

Direction.page = {
    layout: CssDoc,
    title: 'Direction',
    description: 'The direction CSS property sets the direction of text, table columns, and horizontal overflow. Use rtl for languages written from right to left (like Hebrew or Arabic), and ltr for those written from left to right (like English and most other languages).',
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

