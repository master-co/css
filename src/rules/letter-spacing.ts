import MasterCSSRule from '../rule'

export default class extends MasterCSSRule {
    static override id = 'LetterSpacing'
    static override matches =  /^ls:./
    static override unit = 'em'
}