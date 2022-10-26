import MasterCSSRule from '../rule'

export default class extends MasterCSSRule {
    static override id = 'WordSpacing'
    static override propName = 'word-spacing'
    static override unit = 'em'
}