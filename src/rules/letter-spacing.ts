import { MasterCSSRule } from '../rule'

export default class extends MasterCSSRule {
    static override id = 'LetterSpacing'
    static override matches =  /^ls:./
    static override propName = 'letter-spacing'
    static override unit = 'em'
}