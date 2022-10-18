import { MasterCSSRule } from '../rule'

export default class extends MasterCSSRule {
    static override id = 'ColumnSpan'
    static override matches = /^col-span:./
    static override propName = 'column-span'
}