const SIZE_PROXY = '100000000px'
const LENGTH_PROXY = '123456789'
const INTEGER_PROXY = '987654321'
const COLOR_PROXY = '#12345678'

export type SyntaxTrHastNode = {
    type?: string
    value?: string
    children?: SyntaxTrHastNode[]
    properties?: Record<string, unknown>
}

type SyntaxTrTextNode = SyntaxTrHastNode & {
    type: 'text'
    value: string
}

export function createSyntaxTrPlaceholderContext() {
    const valueProxyMap = new Map<string, string>()
    const createPlaceholderProxy = (placeholder: string) => {
        if (placeholder === 'size') return SIZE_PROXY
        if (placeholder === 'length') return LENGTH_PROXY
        if (placeholder === 'integer') return INTEGER_PROXY
        if (placeholder === 'color') return COLOR_PROXY
        const name = placeholder === '…'
            ? 'rest'
            : placeholder.replace(/[^\w-]+/g, '-').replace(/^-|-$/g, '') || 'value'
        const proxyValue = `var(--mcss-syntax-${name})`
        valueProxyMap.set(proxyValue, `<${placeholder}>`)
        return proxyValue
    }
    const proxy = (value: string) => {
        return value
            .replace(/`([^`]+)`/g, (_, placeholder) => createPlaceholderProxy(placeholder))
    }
    const restoreTextNodes = (root: SyntaxTrHastNode) => {
        const entries: { node: SyntaxTrTextNode, parent?: SyntaxTrHastNode, start: number, end: number }[] = []
        let text = ''
        const visit = (node: SyntaxTrHastNode, parent?: SyntaxTrHastNode) => {
            if (node.type === 'text' && typeof node.value === 'string') {
                const start = text.length
                text += node.value
                entries.push({ node: node as SyntaxTrTextNode, parent, start, end: text.length })
                return
            }

            node.children?.forEach((child) => visit(child, node))
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
            addReplacements(new RegExp(escapeRegExp(proxyValue), 'g'), placeholder)
        }
        addReplacements(new RegExp(escapeRegExp(SIZE_PROXY), 'g'), '<size>')
        addReplacements(new RegExp(escapeRegExp(LENGTH_PROXY), 'g'), '<length>')
        addReplacements(new RegExp(escapeRegExp(INTEGER_PROXY), 'g'), '<integer>')
        addReplacements(new RegExp(escapeRegExp(COLOR_PROXY), 'g'), '<color>')

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

    return { proxy, restoreTextNodes }
}

function escapeRegExp(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
