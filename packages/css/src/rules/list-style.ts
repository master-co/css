import MasterCSSRule from '../rule'

export default class extends MasterCSSRule {
    static override id = 'ListStyle'
    static override propName = 'list-style'
    override order = -1
}