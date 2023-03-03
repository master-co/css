import { Rule } from '../'

export class BackgroundColor extends Rule {
    static override id = 'BackgroundColor' as const
    static override colorStarts = '(?:bg|background):'
    static override unit = ''
    static override colorful = true
}