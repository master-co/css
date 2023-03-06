import { Rule } from '../rule'

export class TextDecoration extends Rule {
    static override id = 'TextDecoration' as const
    static override matches = '^t(?:ext)?:(?:underline|line-through|overline|$values)'
    static override colorful = true
    override order = -1
}