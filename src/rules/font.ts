import MasterCSSRule from '../rule'

export default class extends MasterCSSRule {
    static override id = 'Font'
    static override matches = /^f:./
    static override unit = ''
    override order = -1
}