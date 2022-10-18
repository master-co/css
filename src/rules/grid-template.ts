import { MasterCSSRule } from '../rule'

export default class extends MasterCSSRule {
    static override id = 'GridTemplate'
    static override propName = 'grid-template'
    override order = -1
}