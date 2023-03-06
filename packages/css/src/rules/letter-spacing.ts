import { Rule } from '../rule'

export class LetterSpacing extends Rule {
    static id = 'LetterSpacing' as const
    static matches =  '^ls:.'
    static unit = 'em'
}