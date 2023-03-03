import { Rule } from '../'

export class LetterSpacing extends Rule {
    static override id = 'LetterSpacing' as const
    static override matches =  '^ls:.'
    static override unit = 'em'
}