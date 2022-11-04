import MasterCSSRule from '../rule'

export default class extends MasterCSSRule {
    static override id = 'ClipPath'
    static override matches = /^clip:./
}