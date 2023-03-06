import { Rule } from '../rule'

export class TextShadow extends Rule {
    static override id = 'TextShadow' as const
    static override colorful = true
}