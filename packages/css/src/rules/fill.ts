import { Rule } from '../rule'

export class Fill extends Rule {
    static id = 'Fill' as const
    static colorStarts = 'fill:'
    static colorful = true
}