import MasterCSSRule from '../rule'

export default class extends MasterCSSRule {
    static override id = 'Columns'
    static override matches = /^(columns|cols):./
    static override unit = ''
    override order = -1
}