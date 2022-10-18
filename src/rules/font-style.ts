import { MasterCSSRule } from '../rule'

export default class extends MasterCSSRule {
    static override id = 'FontStyle'
    static override matches = /^f(ont)?:(normal|italic|oblique)(?!\|)/
    static override propName = 'font-style'
    static override unit = 'deg'
}