import MasterCSSRule from '../rule'

export default class extends MasterCSSRule {
    static override id = 'GridArea'
    static override propName = 'grid-area'
    static override unit = ''
    override order = -1
}