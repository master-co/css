import Rule from '../rule'

export default class extends Rule {
    static override id: 'TextShadow' = 'TextShadow' as const
    static override colorful = true
}