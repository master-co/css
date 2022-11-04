import MasterCSSRule from '../rule'

export default class extends MasterCSSRule {
    static override id = 'MinWidth'
    static override matches = /^min-w:./
}