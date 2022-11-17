import Rule from '../rule'

export default class extends Rule {
    static override id = 'AccentColor' as const
    static override colorStarts = 'accent:'
    static override colorful = true
}