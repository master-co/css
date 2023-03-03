import { Rule } from '../'

export class TextDecorationColor extends Rule {
    static override id = 'TextDecorationColor' as const
    static override colorStarts = 'text-decoration:'
    static override colorful = true
}