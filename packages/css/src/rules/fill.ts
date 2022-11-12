import Rule from '../rule'

export default class extends Rule {
    static override id: 'Fill' = 'Fill' as const
    static override colorStarts = 'fill:'
    static override colorful = true
}