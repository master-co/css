import { Rule } from '../'

export class CaretColor extends Rule {
    static override id = 'CaretColor' as const
    static override colorStarts = 'caret:'
    static override colorful = true
}