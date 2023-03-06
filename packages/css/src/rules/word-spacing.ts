import { Rule } from '../rule'

export class WordSpacing extends Rule {
    static override id = 'WordSpacing' as const
    static override unit = 'em'
}