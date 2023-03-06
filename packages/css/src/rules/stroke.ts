import { Rule } from '../rule'

export class Stroke extends Rule {
    static override id = 'Stroke' as const
    static override colorful = true
}