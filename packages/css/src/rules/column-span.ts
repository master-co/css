import { Rule } from '../rule'

export class ColumnSpan extends Rule {
    static override id = 'ColumnSpan' as const
    static override matches = '^col-span:.'
}