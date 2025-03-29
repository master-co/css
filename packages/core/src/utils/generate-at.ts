import { AtComponent, AtRule } from '../types/syntax'

export default function generateAt(atRule: AtRule): string {
    const generate = (components: AtComponent[]): string => {
        let text = components.map((comp) => {
            let current = ''
            if (comp.type === 'comparison') {
                current = comp.value
            } else if (comp.type === 'group') {
                current = '(' + generate(comp.children) + ')'
            } else {
                const valueUnit = comp.type === 'number'
                    ? String(comp.value) + (comp.unit || '')
                    : comp.value
                if ('name' in comp) {
                    if ('operator' in comp) {
                        current = `(${comp.name}${comp.operator}${valueUnit})`
                    } else {
                        current = '(' + `${comp.name}:${valueUnit}` + ')'
                    }
                } else {
                    current = valueUnit
                }
            }
            return current
        }).join(atRule.id === 'layer' ? '.' : ' ')
        return text
    }
    const result = generate(atRule.components)
    return '@' + atRule.id + (result
        ? ' ' + result
        : '')
}
