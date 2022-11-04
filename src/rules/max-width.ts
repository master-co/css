import MasterCSSRule from '../rule'

export default class extends MasterCSSRule {
    static override id = 'MaxWidth'
    static override matches = /^max-w:./
}