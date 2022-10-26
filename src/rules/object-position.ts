import MasterCSSRule from '../rule'

export default class extends MasterCSSRule {
    static override id = 'ObjectPosition'
    static override matches = /^(object|obj):(top|bottom|right|left|center)/
    static override propName = 'object-position'
}