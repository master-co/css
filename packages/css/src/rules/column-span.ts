import { Rule } from '../rule'

export class ColumnSpan extends Rule {
    static id = 'ColumnSpan' as const
    static matches = '^col-span:.'
}