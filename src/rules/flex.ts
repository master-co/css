import { MasterCSSRule } from '../rule'

export default class extends MasterCSSRule {
    static override id = 'Flex'
    static override propName = 'flex'
    static override unit = ''
    override order = -1
}