import { Rule } from '../rule'

export class BoxShadow extends Rule {
    static id = 'BoxShadow' as const
    static matches = '^s(?:hadow)?:.'
    static colorful = true
}