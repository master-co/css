import MasterCSSRule from '../rule'

export default class extends MasterCSSRule {
    static override id = 'MaxHeight'
    static override matches = /^max-h:./
    static override propName = 'max-height'
}