import type { MasterCSSManifest } from '@master/css'

type ManifestAtRule = NonNullable<MasterCSSManifest['atRules']>[string]
type ManifestAtRuleNode = ManifestAtRule['nodes'][number]

function generateNodes(nodes: ManifestAtRuleNode[], id: ManifestAtRule['id']): string {
    return nodes.map((node) => {
        if ('children' in node) {
            const body = generateNodes(node.children, id)
            return node.type === 'group' ? `(${body})` : body
        }
        if (node.type === 'boolean') return `(${node.name})`
        if (node.type === 'comparison' || node.type === 'logical') return node.value
        const value = node.type === 'number'
            ? `${node.value}${node.unit || ''}`
            : node.value
        if (node.type === 'number' && !node.name && (id === 'media' || id === 'container')) {
            return `(width${node.operator || '>='}${value})`
        }
        if ('name' in node && node.name) {
            return 'operator' in node
                ? `(${node.name}${node.operator}${value})`
                : `(${node.name}:${value})`
        }
        return value
    }).filter(Boolean).join(id === 'layer' ? '.' : ' ')
}

export default function generateManifestAt(atRule: ManifestAtRule | undefined) {
    if (!atRule) return ''
    const body = generateNodes(atRule.nodes, atRule.id)
    return `@${atRule.id}${body ? ` ${body}` : ''}`
}
