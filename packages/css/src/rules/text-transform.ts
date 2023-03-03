import { Rule } from '../'

export class TextTransform extends Rule {
    static override id = 'TextTransform' as const
    static override matches = '^t(?:ext)?:(?:uppercase|lowercase|capitalize|$values)(?!\\|)'
}