import Rule from '../rule'

export default class extends Rule {
    static override id: 'Stroke' = 'Stroke' as const
    static override colorful = true
}