import { Rule } from '../rule'

export default class extends Rule {
    static override id = 'LetterSpacing' as const
    static override matches =  '^ls:.'
    static override unit = 'em'
}