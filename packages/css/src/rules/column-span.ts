import { Rule } from '../'

export class ColumnSpan extends Rule {
    static override id = 'ColumnSpan' as const
    static override matches = '^col-span:.'
}