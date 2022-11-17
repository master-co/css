import Rule from '../rule'

export default class extends Rule {
    static override id = 'TransformOrigin' as const
    static override matches = '^transform:(?:top|bottom|right|left|center|[0-9]|$values)'
    static override unit = 'px'
}