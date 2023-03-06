import { Rule } from '../rule'

export class TextDecorationLine extends Rule {
    static id = 'TextDecorationLine' as const
    static matches = '^t(?:ext)?:(?:none|underline|overline|line-through|$values)(?!\\|)'
}