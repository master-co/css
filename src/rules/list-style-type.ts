import MasterCSSRule from '../rule'

export default class extends MasterCSSRule {
    static override id = 'ListStyleType'
    static override matches = /^list-style:(disc|decimal)(?!\|)/
}