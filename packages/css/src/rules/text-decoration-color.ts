import { Rule } from '../rule'

export class TextDecorationColor extends Rule {
    static id = 'TextDecorationColor' as const
    static colorStarts = 'text-decoration:'
    static colorful = true
}