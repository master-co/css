import highlightCode from '~/internal/utils/highlight-code'
import { toJsxRuntime } from 'hast-util-to-jsx-runtime'
import { Fragment, jsxs, jsx } from 'react/jsx-runtime'
import dedent from 'ts-dedent'
import { ShikiTransformer } from 'shiki'
import { generateSyntaxTrDeclarations } from './syntax-tr-declarations'
import { createSyntaxTrPlaceholderContext } from './syntax-tr-placeholders'

export default async function SyntaxTr({ value, children, previewSyntax }: any) {
    value = (Array.isArray(value) ? value[0] : value) as string
    const placeholders = createSyntaxTrPlaceholderContext()
    const proxyCode = placeholders.proxy(value)
    const declarations = generateSyntaxTrDeclarations(proxyCode, previewSyntax)
    const text = dedent`
        __TMP__ {
        ${convertDeclarationsToCSS(declarations)}}`
    const transformerRestore: ShikiTransformer = {
        root(root) {
            placeholders.restoreTextNodes(root)
        },
    }
    const hast = await highlightCode(text, {
        lang: 'css',
        inline: true,
        className: 'text:body white-space:pre b:0 p:0 r:0 bg:transparent',
        transformers: [transformerRestore]
    })
    const codeElement = (hast.children[0] as any)
    const lineElements = codeElement.children
    lineElements.splice(0, 1) // remove __TMP__ {
    lineElements.splice(0, 1) // remove \n
    lineElements.splice(lineElements.length - 1, 1) // remove }
    const keyHast = await highlightCode(proxyCode, {
        lang: 'plaintext',
        inline: true,
        transformers: [transformerRestore]
    })
    return (
        <tr key={value}>
            <td className='white-space:nowrap'>
                {children}
                {toJsxRuntime(keyHast as any, { Fragment, jsxs, jsx })}
            </td>
            <td>
                {value && text && toJsxRuntime(hast as any, { Fragment, jsxs, jsx })}
            </td>
        </tr>
    )
}

function convertDeclarationsToCSS(obj: any) {
    let cssText = ''
    for (const property in obj) {
        if (Object.hasOwn(obj, property)) {
            cssText += `${property}: ${obj[property]};\n`
        }
    }
    return cssText
}
