import { MasterCSSRule } from '../rule'

export default class extends MasterCSSRule {
    static override id = 'LineHeight'
    static override matches = /^lh:./
    static override propName = 'line-height'
    static override unit = ''
}