import MasterCSSRule from '../rule'

export default class extends MasterCSSRule {
    static override id = 'JustifySelf'
    static override matches =  /^js:./
}