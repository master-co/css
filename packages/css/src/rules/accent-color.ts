import { Rule } from '../rule'

export class AccentColor extends Rule {
    static override id = 'AccentColor' as const
    static override colorStarts = 'accent:'
    static override colorful = true
}