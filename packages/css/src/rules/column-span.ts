import Rule from '../rule'

export default class extends Rule {
    static override id: 'ColumnSpan' = 'ColumnSpan' as const
    static override matches = /^col-span:./
}