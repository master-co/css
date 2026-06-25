const SIZE_PROXY = '100000000px'
const LENGTH_PROXY = '123456789'
const INTEGER_PROXY = '987654321'
const NUMBER_PROXY = '246813579'
const PERCENTAGE_PROXY = '88%'
const COLOR_PROXY = '#12345678'
const HEX_PROXY = '123456'
const ANGLE_PROXY = '45deg'
const TIME_PROXY = '1s'
const PLACEHOLDER_CLASS = 'text:muted italic mr:0.125rem:not(:last)'

export type SyntaxTrHastNode = {
    type?: string
    tagName?: string
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
    const trackProxy = (proxyValue: string, placeholder: string) => {
        valueProxyMap.set(proxyValue, `<${placeholder}>`)
        return proxyValue
    }
    const createPlaceholderProxy = (placeholder: string, value: string, offset: number) => {
        const prefix = value.slice(0, offset)
        if (prefix.endsWith('animate:') && placeholder === 'name') {
            valueProxyMap.set('fade', '<name>')
            valueProxyMap.set('var(--animate-fade)', '<name>')
            return 'fade'
        }
        if (prefix.endsWith('user-drag:')) {
            return trackProxy('auto', placeholder)
        }
        if (/url\($/.test(prefix)) {
            return trackProxy(placeholder === 'svg' ? '#mcss-syntax-svg' : '/mcss-syntax-rest.svg', placeholder)
        }
        if (prefix.endsWith('#') && placeholder === 'hex') return HEX_PROXY
        if (placeholder === 'size') return SIZE_PROXY
        if (placeholder === 'length') return LENGTH_PROXY
        if (placeholder === 'integer') return INTEGER_PROXY
        if (placeholder === 'number') return trackProxy(NUMBER_PROXY, placeholder)
        if (placeholder === 'percentage') return trackProxy(PERCENTAGE_PROXY, placeholder)
        if (placeholder === 'color') return COLOR_PROXY
        if (placeholder === 'angle' || placeholder === 'degree') return trackProxy(ANGLE_PROXY, placeholder)
        if (placeholder === 'time' || placeholder === 'duration' || placeholder === 'milliSeconds') return trackProxy(TIME_PROXY, placeholder)
        const name = placeholder === '…'
            ? 'rest'
            : placeholder.replace(/[^\w-]+/g, '-').replace(/^-|-$/g, '') || 'value'
        const proxyValue = `var(--mcss-syntax-${name})`
        return trackProxy(proxyValue, placeholder)
    }
    const proxy = (value: string) => {
        return value
            .replace(/`([^`]+)`/g, (match, placeholder, offset) => createPlaceholderProxy(placeholder, value, offset))
    }
    const restoreTextNodes = (root: SyntaxTrHastNode) => {
        const entries: { node: SyntaxTrTextNode, parent?: SyntaxTrHastNode, index: number, start: number, end: number }[] = []
        let text = ''
        const visit = (node: SyntaxTrHastNode, parent?: SyntaxTrHastNode) => {
            if (node.type === 'text' && typeof node.value === 'string') {
                const start = text.length
                text += node.value
                const index = parent?.children?.indexOf(node) ?? -1
                entries.push({ node: node as SyntaxTrTextNode, parent, index, start, end: text.length })
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
        addReplacements(new RegExp(escapeRegExp(HEX_PROXY), 'g'), '<hex>')

        if (!replacements.length) return

        replacements.sort((a, b) => a.start - b.start || b.end - b.start - (a.end - a.start))
        for (let entryIndex = entries.length - 1; entryIndex >= 0; entryIndex--) {
            const entry = entries[entryIndex]
            const nodes: SyntaxTrHastNode[] = []
            let cursor = entry.start
            const pushText = (value: string) => {
                if (value) nodes.push({ type: 'text', value })
            }
            const pushPlaceholder = (value: string) => {
                nodes.push({
                    type: 'element',
                    tagName: 'span',
                    properties: { class: PLACEHOLDER_CLASS },
                    children: [{ type: 'text', value }]
                })
            }

            for (const replacement of replacements) {
                if (replacement.end <= entry.start) continue
                if (replacement.start >= entry.end) break
                if (replacement.start < cursor) {
                    cursor = Math.max(cursor, Math.min(replacement.end, entry.end))
                    continue
                }

                if (replacement.start >= cursor) {
                    pushText(text.slice(cursor, replacement.start))
                }

                if (replacement.start >= entry.start && replacement.start < entry.end) {
                    pushPlaceholder(replacement.value)
                }

                cursor = Math.max(cursor, Math.min(replacement.end, entry.end))
            }
            pushText(text.slice(cursor, entry.end))

            if (entry.parent?.children && entry.index !== -1) {
                entry.parent.children.splice(entry.index, 1, ...nodes)
            } else {
                entry.node.value = nodes.map(collectText).join('')
            }
        }
    }

    return { proxy, restoreTextNodes }
}

function collectText(node: SyntaxTrHastNode): string {
    if (node.type === 'text') return node.value ?? ''
    return node.children?.map(collectText).join('') ?? ''
}

function escapeRegExp(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
