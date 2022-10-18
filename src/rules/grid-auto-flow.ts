import { MasterCSSRule } from '../rule'

export default class extends MasterCSSRule {
    static override id = 'GridAutoFlow'
    static override matches = /^grid-flow:./
    static override propName = 'grid-auto-flow'
}