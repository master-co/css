import MasterCSSRule from '../rule'

export default class extends MasterCSSRule {
    static override id = 'AlignSelf'
    static override matches = /^as:./
}