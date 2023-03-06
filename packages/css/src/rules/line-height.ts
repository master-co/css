import { Rule } from '../rule'

export class LineHeight extends Rule {
    static override id = 'LineHeight' as const
    static override matches = '^lh:.'
    static override unit = ''
}