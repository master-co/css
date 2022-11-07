import Rule from '../rule'

export default class extends Rule {
    static override id = 'LetterSpacing'
    static override matches =  /^ls:./
    static override unit = 'em'
}