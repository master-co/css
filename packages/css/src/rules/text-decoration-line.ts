import { Rule } from '../rule'

export class TextDecorationLine extends Rule {
    static override id = 'TextDecorationLine' as const
    static override matches = '^t(?:ext)?:(?:none|underline|overline|line-through|$values)(?!\\|)'
}