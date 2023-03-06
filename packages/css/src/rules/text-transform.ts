import { Rule } from '../rule'

export class TextTransform extends Rule {
    static id = 'TextTransform' as const
    static matches = '^t(?:ext)?:(?:uppercase|lowercase|capitalize|$values)(?!\\|)'
}