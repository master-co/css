import { Rule } from '../rule'

export class OutlineColor extends Rule {
    static override id = 'OutlineColor' as const
    static override colorStarts = 'outline:'
    static override colorful = true
}