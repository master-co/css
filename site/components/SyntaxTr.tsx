import highlightCode from '~/internal/utils/highlight-code'
import { toJsxRuntime } from 'hast-util-to-jsx-runtime'
import { Fragment, jsxs, jsx } from 'react/jsx-runtime'
import dedent from 'ts-dedent'
import { ShikiTransformer } from 'shiki'
import css from '../common/preset-css'

export default async function SyntaxTr({ value, children, previewSyntax }: any) {
    value = (Array.isArray(value) ? value[0] : value) as string
    const valueProxyMap = new Map()
    const createPlaceholderProxy = (placeholder: string) => {
        if (placeholder === 'size') return '100000000px'
        if (placeholder === 'length') return '123456789'
        if (placeholder === 'color') return '#12345678'
        const name = placeholder === '…'
            ? 'rest'
            : placeholder.replace(/[^\w-]+/g, '-').replace(/^-|-$/g, '') || 'value'
        const proxyValue = `var(--mcss-syntax-${name})`
        valueProxyMap.set(proxyValue, `<${placeholder}>`)
        return proxyValue
    }
    const proxy = (_value: string) => {
        return _value
            .replace(/`([^`]+)`/g, (_, placeholder) => createPlaceholderProxy(placeholder))
    }
    const proxyCode = proxy(value)
    const rule = css.generate(previewSyntax || proxyCode)[0]
    const declarations = rule?.declarations as Record<string, any> | undefined
    const text = dedent`
        __TMP__ {
        ${declarations ? convertDeclarationsToCSS(declarations) : ''}}`
    const restoreTextNodes = (root: any) => {
        const entries: { node: any, parent?: any, start: number, end: number }[] = []
        let text = ''
        const visit = (node: any, parent?: any) => {
            if (node.type === 'text') {
                const start = text.length
                text += node.value
                entries.push({ node, parent, start, end: text.length })
                return
            }

            node.children?.forEach((child: any) => visit(child, node))
        }
        visit(root)

        if (!entries.length) return

        const replacements: { start: number, end: number, value: string }[] = []
        const addReplacements = (pattern: RegExp, value: string) => {
            pattern.lastIndex = 0
            for (const match of text.matchAll(pattern)) {
                const start = match.index ?? 0
                replacements.push({
                    start,
                    end: start + match[0].length,
                    value
                })
            }
        }

        for (const [proxyValue, placeholder] of valueProxyMap) {
            addReplacements(new RegExp(proxyValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), placeholder)
        }
        addReplacements(/100000000px/g, '<size>')
        addReplacements(/123456789/g, '<length>')
        addReplacements(/#12345678/g, '<color>')

        if (!replacements.length) return

        replacements.sort((a, b) => a.start - b.start)
        for (const entry of entries) {
            let value = ''
            let cursor = entry.start
            for (const replacement of replacements) {
                if (replacement.end <= entry.start) continue
                if (replacement.start >= entry.end) break

                if (replacement.start >= cursor) {
                    value += text.slice(cursor, replacement.start)
                }

                if (replacement.start >= entry.start && replacement.start < entry.end) {
                    value += replacement.value
                    if (entry.parent?.properties) {
                        entry.parent.properties.class = 'text:muted italic mr:0.125rem:not(:last)'
                    }
                }

                cursor = Math.max(cursor, Math.min(replacement.end, entry.end))
            }
            value += text.slice(cursor, entry.end)
            entry.node.value = value
        }
    }
    const transformerRestore: ShikiTransformer = {
        root(root) {
            restoreTextNodes(root)
        },
    }
    const hast = await highlightCode(text, {
        lang: 'css',
        inline: true,
        className: 'text:text white-space:pre b:0 p:0 r:0 bg:transparent',
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
