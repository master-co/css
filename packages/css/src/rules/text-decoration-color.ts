import Rule from '../rule'

export default class extends Rule {
    static override id = 'TextDecorationColor' as const
    static override colorStarts = 'text-decoration:'
    static override colorful = true
}