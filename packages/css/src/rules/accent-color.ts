import { Rule } from '../'

export class AccentColor extends Rule {
    static override id = 'AccentColor' as const
    static override colorStarts = 'accent:'
    static override colorful = true
}