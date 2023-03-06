import { Rule } from '../rule'

export class LineHeight extends Rule {
    static id = 'LineHeight' as const
    static matches = '^lh:.'
    static unit = ''
}