import { Rule } from '../rule'

export class CaretColor extends Rule {
    static id = 'CaretColor' as const
    static colorStarts = 'caret:'
    static colorful = true
}