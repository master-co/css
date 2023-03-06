import { Rule } from '../rule'

export class TextDecoration extends Rule {
    static id = 'TextDecoration' as const
    static matches = '^t(?:ext)?:(?:underline|line-through|overline|$values)'
    static colorful = true
    override order = -1
}