import MasterCSSRule from '../rule'

export default class extends MasterCSSRule {
    static override id = 'Transition'
    static override symbol = '~' 
    override order = -1
}