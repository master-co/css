import { Rule } from '../rule'

export class Fill extends Rule {
    static override id = 'Fill' as const
    static override colorStarts = 'fill:'
    static override colorful = true
}