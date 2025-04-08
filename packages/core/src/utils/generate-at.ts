import { AtRule, AtRuleNode } from './parse-at'

export default function generateAt(atRule: AtRule): string {
    const generate = (nodes: AtRuleNode[]): string => {
        let text = nodes.map((comp) => {
            let current = ''
            if ('children' in comp) {
                const body = generate(comp.children)
                current = comp.type === 'group'
                    ? '(' + body + ')'
                    : body
            } else {
                const value = comp.type === 'number'
                    ? String(comp.value) + (comp.unit || '')
                    : comp.value
                if ('name' in comp) {
                    if ('operator' in comp) {
                        current = '(' + `${comp.name}${comp.operator}${value}` + ')'

                    } else {
                        current = '(' + `${comp.name}:${value}` + ')'
                    }
                } else {
                    current = value
                }
            }
            return current
        })
            .filter(Boolean)
            .join(atRule.id === 'layer' ? '.' : ' ')
        return text
    }
    const result = generate(atRule.nodes)
    return '@' + atRule.id + (result
        ? ' ' + result
        : '')
}
