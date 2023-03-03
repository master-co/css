import { Rule } from '../'

export class ScrollSnapType extends Rule {
    static override id = 'ScrollSnapType' as const
    static override matches = '^scroll-snap:(?:(?:[xy]|block|inline|both)(?:\\|(?:proximity|mandatory))?|$values)(?!\\|)'
}