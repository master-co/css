import Rule from '../rule'

export default class extends Rule {
    static override id: 'TransformOrigin' = 'TransformOrigin' as const
    static override matches = /^transform:((top|bottom|right|left|center)|\d)/
    static override unit = 'px'
}