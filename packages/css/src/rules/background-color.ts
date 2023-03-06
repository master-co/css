import { Rule } from '../rule'

export class BackgroundColor extends Rule {
    static override id = 'BackgroundColor' as const
    static override colorStarts = '(?:bg|background):'
    static override unit = ''
    static override colorful = true
}