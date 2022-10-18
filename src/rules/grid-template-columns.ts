import { MasterCSSRule } from '../rule'

export default class extends MasterCSSRule {
    static override id = 'GridTemplateColumns'
    static override matches = /^grid-template-cols:./
    static override propName = 'grid-template-columns'
}