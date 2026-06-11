import highlightCode from '~/internal/utils/highlight-code'
import { toJsxRuntime } from 'hast-util-to-jsx-runtime'
import { Fragment, jsxs, jsx } from 'react/jsx-runtime'
import dedent from 'ts-dedent'
import { ShikiTransformer } from 'shiki'
import css from '../common/preset-css'

export default async function SyntaxTr({ value, children }: any) {
    value = (Array.isArray(value) ? value[0] : value) as string
    const valueProxyMap = new Map()
    const proxy = (_value: string) => {
        return _value
            .replace(/`size`/g, '100000000')
            .replace(/`color`/g, '#12345678')
            .replace(/`n\/d`/g, '9876536/8')
    }
    const restore = (_value: string) => {
        for (const [key, value] of valueProxyMap) {
            _value = _value.replace(new RegExp(value, 'g'), key)
        }
        return _value
            .replace(/100000000/g, '<size>')
            .replace(/#12345678/g, '<color>')
            .replace(/6250000/g, '<size>/' + css.config.rootSize)
            .replace(/1234567/g, '<n>')
            .replace(/7654321/g, '<d>')
            .replace(/16.12902045785642/g, '<n/d>*100')
    }
    const proxyCode = proxy(value)
    const rule = css.generate(proxyCode)[0]
    if (!rule) {
        throw new Error(`Class "${value}" not found`)
    }
    const declarations = rule.declarations as Record<string, any>
    const text = dedent`
        __TMP__ {
        ${convertDeclarationsToCSS(declarations)}}`
    const transformerRestore: ShikiTransformer = {
        span(element) {
            element.children.forEach((child: any) => {
                if (child.type === 'text') {
                    const newValue = restore(child.value)
                    if (child.value !== newValue) {
                        child.value = newValue
                        element.properties.class = 'fg:light italic mr:2:not(:last)'
                    }
                }
            })
        },
    }
    const hast = await highlightCode(text, {
        lang: 'css',
        inline: true,
        className: 'fg:neutral white-space:pre',
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
