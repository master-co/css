import Rule from '../rule'

export default class extends Rule {
    static override id = 'ColumnSpan'
    static override matches = /^col-span:./
}