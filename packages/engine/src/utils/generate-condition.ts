import { Condition, ConditionNode } from './parse-condition'

export default function generateCondition(condition: Condition): string {
  const generate = (nodes: ConditionNode[]): string => {
    let text = nodes.map((comp) => {
      let current = ''
      if ('children' in comp) {
        const body = generate(comp.children)
        current = comp.type === 'group'
          ? '(' + body + ')'
          : body
      } else {
        if (comp.type === 'boolean') {
          current = `(${comp.name})`
          return current
        }
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
      .join(condition.id === 'layer' ? '.' : ' ')
    return text
  }
  const result = generate(condition.nodes)
  return '@' + condition.id + (result
    ? ' ' + result
    : '')
}
