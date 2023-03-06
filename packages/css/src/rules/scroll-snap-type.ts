import { Rule } from '../rule'

export class ScrollSnapType extends Rule {
    static id = 'ScrollSnapType' as const
    static matches = '^scroll-snap:(?:(?:[xy]|block|inline|both)(?:\\|(?:proximity|mandatory))?|$values)(?!\\|)'
}