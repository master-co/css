import MasterCSSRule from '../rule'

export default class extends MasterCSSRule {
    static override id = 'Transition'
    static override symbol = '~' 
    static override propName = 'transition'
    override order = -1
}