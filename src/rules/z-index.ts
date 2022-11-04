import MasterCSSRule from '../rule'

export default class extends MasterCSSRule {
    static override id = 'ZIndex'
    static override matches = /^z:./
    static override unit = ''
}