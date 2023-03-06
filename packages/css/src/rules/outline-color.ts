import { Rule } from '../rule'

export class OutlineColor extends Rule {
    static id = 'OutlineColor' as const
    static colorStarts = 'outline:'
    static colorful = true
}