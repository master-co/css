import MasterCSSRule from '../rule'

export default class extends MasterCSSRule {
    static override id = 'AlignItems'
    static override matches = /^ai:./
}